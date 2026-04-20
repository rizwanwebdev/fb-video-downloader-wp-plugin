jQuery(document).ready(function($) {
    let pendingDownload = null;

    $('.uvd-main-wrapper').on('contextmenu', 'video, .uvd-download-btn, .uvd-video-preview-wrapper', function(e) {
        e.preventDefault();
        return false;
    });

    $('#uvd-fetch-btn').on('click', function() {
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
        loader.show();

        $.post(uvd_ajax.ajax_url, {
            action: 'fetch_video_info',
            nonce: uvd_ajax.nonce,
            url: url
        }, function(response) {
            if (response.success) {
                renderResult(response.data);
            } else {
                $('#uvd-error-container').html('<p style="margin:0;">' + response.data.message + '</p>').fadeIn();
            }
            btn.prop('disabled', false);
            text.show();
            loader.hide();
        }).fail(function() {
            $('#uvd-error-container').html('<p style="margin:0;">Network error. Please try again.</p>').fadeIn();
            btn.prop('disabled', false);
            text.show();
            loader.hide();
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
            html += '<button type="button" class="uvd-download-btn uvd-download-hd hd" data-url="' + data.hd + '" data-filename="' + hdFilename + '" data-type="hd">';
            html += '<svg style="width:20px;height:20px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
            html += 'Download HD</button>';
        }
        if (data.sd) {
             var sdFilename = baseFilename + '-sd.mp4';
             html += '<button type="button" class="uvd-download-btn uvd-download-sd" data-url="' + data.sd + '" data-filename="' + sdFilename + '" data-type="sd">';
             html += '<svg style="width:20px;height:20px;margin-right:8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>';
             html += 'Download SD</button>';
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

        $('.uvd-download-btn').on('click', function() {
            var $this = $(this);
            var type = $this.attr('data-type');
            var videoInfo = {
                url: $this.attr('data-url'),
                filename: $this.attr('data-filename'),
                btn: $this
            };

            var shouldShowAd = (type === 'hd' && uvd_ajax.enable_ads_hd) || (type === 'sd' && uvd_ajax.enable_ads_sd);

            if (shouldShowAd) {
                pendingDownload = videoInfo;
                showAdModal();
            } else {
                downloadVideo(videoInfo.url, videoInfo.filename, videoInfo.btn);
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
        $('#uvd-ad-modal').fadeOut(200, function() {
            if (pendingDownload) {
                downloadVideo(pendingDownload.url, pendingDownload.filename, pendingDownload.btn);
                pendingDownload = null;
            }
        });
    });

    function downloadVideo(url, filename, btn) {
        // Append &dl=1 to the URL to tell Facebook CDN to force download
        var downloadUrl = url;
        if (downloadUrl.indexOf('dl=1') === -1) {
            if (downloadUrl.indexOf('?') === -1) {
                downloadUrl += '?dl=1';
            } else {
                downloadUrl += '&dl=1';
            }
        }
        
        var a = document.createElement('a');
        a.style.display = 'none';
        a.href = downloadUrl;
        // The download attribute suggests a filename, but native fbcdn handles the content-disposition
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
});
