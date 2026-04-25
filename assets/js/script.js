jQuery(document).ready(function($) {
    let pendingDownload = null;

    // Prevent context menu on videos/images to protect sources
    $('.uvd-main-wrapper').on('contextmenu', 'video, img, .uvd-download-btn, .uvd-video-preview-wrapper', function(e) {
        e.preventDefault();
        return false;
    });

    $('.uvd-main-wrapper').on('click', '#uvd-fetch-btn', function(e) {
        e.preventDefault();
        
        var wrapper = $(this).closest('.uvd-main-wrapper');
        if (wrapper.data('isFetching')) return;
        
        var urlInput = wrapper.find('#uvd-url-input');
        var url = urlInput.val().trim();
        if (!url) {
            urlInput.focus();
            return;
        }

        var btn = $(this);
        var loader = btn.find('.uvd-loader');
        var text = btn.find('.uvd-btn-text');

        wrapper.find('#uvd-result-container, #uvd-error-container').hide().empty();
        btn.prop('disabled', true);
        text.hide();
        
        loader.css('display', 'inline-block');
        wrapper.data('isFetching', true);

        $.post(uvd_ajax.ajax_url, {
            action: 'uvd_get_data',
            nonce: uvd_ajax.nonce,
            u: btoa(unescape(encodeURIComponent(url))) // Base64 encode to bypass WAF/Firewalls
        }, function(response) {
            if (response.success) {
                renderResult(response.data, wrapper);
            } else {
                wrapper.find('#uvd-error-container').html('<p style="margin:0;">' + response.data.message + '</p>').fadeIn();
            }
            btn.prop('disabled', false);
            text.show();
            loader.hide();
            wrapper.data('isFetching', false);
        }).fail(function(xhr) {
            var status = xhr.status;
            var msg = 'Network error (' + status + '). Please try again.';
            if (status === 403) msg = '<strong>Access Denied (403)</strong>: Your hosting firewall (ModSecurity) is blocking the request. Please disable ModSecurity in cPanel or whitelist this action.';
            if (status === 500) msg = 'Server Error (500). Please check your website error logs.';
            if (status === 0) msg = 'Connection failed. Check your internet or browser privacy extensions.';
            
            wrapper.find('#uvd-error-container').html('<p style="margin:0;">' + msg + '</p>').fadeIn();
            btn.prop('disabled', false);
            text.show();
            loader.hide();
            wrapper.data('isFetching', false);
        });
    });

    function sanitizeFilename(name) {
        if (!name) return 'fb-video';
        return name.toString()
            .replace(/[\\\/:\*\?"<>\|]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 100);
    }

    function renderResult(data, wrapper) {
        var html = '';
        var previewUrl = data.hd || data.sd;
        var baseFilename = sanitizeFilename(data.title || 'fb-video');

        if (previewUrl) {
            html += '<div class="uvd-video-preview-wrapper">';
            html += '  <video src="' + previewUrl + '" playsinline style="cursor:pointer;"></video>';
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

        var resultContainer = wrapper.find('#uvd-result-container');
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

        resultContainer.find('.uvd-download-btn').on('click', function(e) {
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
                e.preventDefault(); 
                pendingDownload = {
                    url: $this.attr('href'),
                    wrapper: wrapper
                };
                showAdModal(wrapper);
            }
        });

        $('html, body').animate({
            scrollTop: resultContainer.offset().top - 100
        }, 500);
    }

    function showAdModal(wrapper) {
        var modal = wrapper.find('#uvd-ad-modal');
        var adBody = wrapper.find('#uvd-ad-body');
        var closeBtn = wrapper.find('#uvd-close-ad');
        
        adBody.html(uvd_ajax.ad_code);
        closeBtn.hide(); 
        modal.fadeIn(300);

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

    $('.uvd-main-wrapper').on('click', '#uvd-close-ad', function() {
        if (pendingDownload) {
            window.location.href = pendingDownload.url;
            pendingDownload = null;
        }
        $(this).closest('#uvd-ad-modal').fadeOut(200);
    });
});
