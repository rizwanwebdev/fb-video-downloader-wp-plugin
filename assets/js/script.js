jQuery(document).ready(function($) {
    let pendingDownload = null;
    let isFetching = false;

    $('.uvd-main-wrapper').on('contextmenu', 'video, .uvd-download-btn, .uvd-video-preview-wrapper', function(e) {
        e.preventDefault();
        return false;
    });

    $('#uvd-fetch-btn').on('click', function(e) {
        e.preventDefault();
        if (isFetching) return;
        
        var urlInput = $('#uvd-url-input');
        var url = urlInput.val().trim();
        if (!url) {
            urlInput.focus();
            return;
        }

        var btn = $(this);
        var loader = btn.find('.uvd-loader');
        var text = btn.find('.uvd-btn-text');

        $('#uvd-result-container, #uvd-error-container').hide().empty();
        btn.prop('disabled', true);
        text.hide();
        
        loader.css('display', 'inline-block');
        isFetching = true;

        $.post(uvd_ajax.ajax_url, {
            action: 'uvd_get_data',
            nonce: uvd_ajax.nonce,
            u: btoa(unescape(encodeURIComponent(url))) // Base64 encode to bypass WAF/Firewalls
        }, function(response) {
            if (response.success) {
                renderResult(response.data);
            } else {
                $('#uvd-error-container').html('<p style="margin:0;">' + response.data.message + '</p>').fadeIn();
            }
            btn.prop('disabled', false);
            text.show();
            loader.hide();
            isFetching = false;
        }).fail(function(xhr) {
            var status = xhr.status;
            var msg = 'Network error (' + status + '). Please try again.';
            if (status === 403) msg = 'Access Denied (403). A security plugin/firewall is blocking the request.';
            if (status === 500) msg = 'Server Error (500). Please check your website error logs.';
            if (status === 0) msg = 'Connection failed. Check your internet or browser privacy extensions.';
            
            $('#uvd-error-container').html('<p style="margin:0;">' + msg + '</p>').fadeIn();
            btn.prop('disabled', false);
            text.show();
            loader.hide();
            isFetching = false;
        });
    });

    function sanitizeFilename(name) {
        if (!name) return 'fb-video';
        return name.toString()
            .replace(/[\\\/:\*\?"<>\|]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100);
    }

    function renderResult(data) {
        var html = '';
        var previewUrl = data.hd || data.sd;
        var baseFilename = sanitizeFilename(data.title || 'fb-video');

        if (previewUrl) {
            html += '<div class="uvd-video-preview-wrapper">';
            html += '  <video src="' + previewUrl + '" playsinline></video>';
            html += '  <div class="uvd-video-play-pause-overlay">';
            html += '    <div class="uvd-play-icon"></div>';
            html += '  </div>';
            html += '</div>';
        }

        html += '<div class="uvd-download-options">';
        if (data.hd) {
            var hdFilename = baseFilename + '-hd.mp4';
            var hdUrl = data.hd + (data.hd.indexOf('?') === -1 ? '?dl=1' : '&dl=1');
            html += '<a href="' + hdUrl + '" download="' + hdFilename + '" class="uvd-download-btn uvd-download-hd hd" data-type="hd" >';
            html += '<svg style="width:20px;height:20px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
            html += 'Download HD</a>';
        }
        if (data.sd) {
             var sdFilename = baseFilename + '-sd.mp4';
             var sdUrl = data.sd + (data.sd.indexOf('?') === -1 ? '?dl=1' : '&dl=1');
             html += '<a href="' + sdUrl + '" download="' + sdFilename + '" class="uvd-download-btn uvd-download-sd" data-type="sd" >';
             html += '<svg style="width:20px;height:20px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
             html += 'Download SD</a>';
        }
        html += '</div>';

        var resultContainer = $('#uvd-result-container');
        resultContainer.html(html).fadeIn(400);
        
        var videoWrapper = resultContainer.find('.uvd-video-preview-wrapper');
        var video = videoWrapper.find('video')[0];
        
        videoWrapper.on('click', function() {
            if (video.paused) {
                video.play();
                videoWrapper.addClass('uvd-video-playing');
                videoWrapper.find('.uvd-video-play-pause-overlay').html('<div class="uvd-pause-icon"></div>');
            } else {
                video.pause();
                videoWrapper.removeClass('uvd-video-playing');
                videoWrapper.find('.uvd-video-play-pause-overlay').html('<div class="uvd-play-icon"></div>');
            }
        });

        $(video).on('ended', function() {
            videoWrapper.removeClass('uvd-video-playing');
            videoWrapper.find('.uvd-video-play-pause-overlay').html('<div class="uvd-play-icon"></div>');
        });

        $('.uvd-download-btn').on('click', function(e) {
            var $this = $(this);
            var type = $this.attr('data-type');
            var originalHtml = $this.html();
            var typeLabel = type.toUpperCase();

            // Animated Visual feedback
            $this.addClass('uvd-btn-loading');
            var dots = 0;
            var dotInterval = setInterval(function() {
                dots = (dots + 1) % 4;
                var dotStr = '';
                for(var i=0; i<dots; i++) dotStr += '.';
                $this.html('Downloading ' + typeLabel + dotStr);
            }, 500);
            
            setTimeout(function() {
                clearInterval(dotInterval);
                $this.html(originalHtml);
                $this.removeClass('uvd-btn-loading');
            }, 3000);

            var shouldShowAd = (type === 'hd' && uvd_ajax.enable_ads_hd) || (type === 'sd' && uvd_ajax.enable_ads_sd);

            if (shouldShowAd) {
                e.preventDefault(); // Stop native navigation to show the ad modal
                pendingDownload = {
                    url: $this.attr('href')
                };
                showAdModal();
            }
        });

        $('html, body').animate({
            scrollTop: resultContainer.offset().top - 100
        }, 500);
    }

    function showAdModal() {
        var modal = $('#uvd-ad-modal');
        var adBody = $('#uvd-ad-body');
        var closeBtn = $('#uvd-close-ad');
        
        adBody.html(uvd_ajax.ad_code);
        closeBtn.hide(); // Hide close button initially
        modal.fadeIn(300);

        // Show close button after delay
        var delay = parseInt(uvd_ajax.ad_delay) || 2;
        setTimeout(function() {
            closeBtn.fadeIn(200);
        }, delay * 1000);

        adBody.find('script').each(function() {
            var newScript = document.createElement("script");
            if (this.src) { newScript.src = this.src; } else { newScript.text = this.text; }
            document.head.appendChild(newScript).parentNode.removeChild(newScript);
        });
    }

    $('#uvd-close-ad').on('click', function() {
        if (pendingDownload) {
            // Trigger native download navigation (this is fully supported by iOS Safari for cross-origin if headers are correct)
            window.location.href = pendingDownload.url;
            pendingDownload = null;
        }
        $('#uvd-ad-modal').fadeOut(200);
    });
});
