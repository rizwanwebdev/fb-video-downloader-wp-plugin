<?php
/**
 * Plugin Name: All Facebook Video Downloader
 * Description: Download and preview videos from Facebook (Reels, Watch, and Public Videos). Includes Appearance Customization, Ads, and Custom Player. Shortcode: [video_downloader]
 * Version: 2.2
 * Author: Rizwan
 * Author URI: https://rizwan.one
 */

if (!defined('ABSPATH')) {
    exit;
}

class UniversalVideoDownloader {

    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_shortcode('video_downloader', [$this, 'shortcode_html']);
        add_action('wp_ajax_nopriv_uvd_get_data', [$this, 'handle_ajax_request']);
        add_action('wp_ajax_uvd_get_data', [$this, 'handle_ajax_request']);
        
        // Admin Settings
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'settings_init']);
    }

    public function add_admin_menu() {
        add_menu_page(
            'FB Downloader',
            'FB Downloader',
            'manage_options',
            'uvd-settings',
            [$this, 'settings_page_html'],
            'dashicons-download',
            80
        );
    }

    public function settings_init() {
        // Ads Settings
        register_setting('uvd_settings_group', 'uvd_enable_ads_hd');
        register_setting('uvd_settings_group', 'uvd_enable_ads_sd');
        register_setting('uvd_settings_group', 'uvd_ad_code');
        register_setting('uvd_settings_group', 'uvd_ad_delay');

        // Appearance Settings
        register_setting('uvd_settings_group', 'uvd_input_border_color');
        register_setting('uvd_settings_group', 'uvd_fetch_btn_bg');
        register_setting('uvd_settings_group', 'uvd_fetch_btn_text');
        register_setting('uvd_settings_group', 'uvd_hd_btn_bg');
        register_setting('uvd_settings_group', 'uvd_hd_btn_text');
        register_setting('uvd_settings_group', 'uvd_sd_btn_bg');
        register_setting('uvd_settings_group', 'uvd_sd_btn_text');
        register_setting('uvd_settings_group', 'uvd_spinner_color');
        register_setting('uvd_settings_group', 'uvd_placeholder_text');
        register_setting('uvd_settings_group', 'uvd_button_text');

        add_settings_section('uvd_ads_section', 'Advertisement Settings', null, 'uvd-settings');
        add_settings_section('uvd_appearance_section', 'Appearance & Text Settings', null, 'uvd-settings');

        // Ads Fields
        add_settings_field('uvd_enable_ads_hd', 'Enable Ads/HD', [$this, 'render_checkbox'], 'uvd-settings', 'uvd_ads_section', ['id' => 'uvd_enable_ads_hd']);
        add_settings_field('uvd_enable_ads_sd', 'Enable Ads/SD', [$this, 'render_checkbox'], 'uvd-settings', 'uvd_ads_section', ['id' => 'uvd_enable_ads_sd']);
        add_settings_field('uvd_ad_delay', 'Ad Popup Delay (seconds)', [$this, 'render_input'], 'uvd-settings', 'uvd_ads_section', ['id' => 'uvd_ad_delay', 'type' => 'number', 'placeholder' => '2']);
        add_settings_field('uvd_ad_code', 'Ad HTML/Script Code', [$this, 'ad_code_render'], 'uvd-settings', 'uvd_ads_section');

        // Appearance Fields
        add_settings_field('uvd_input_border_color', 'Input Border Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_input_border_color', 'type' => 'color', 'default' => '#dddfe2']);
        add_settings_field('uvd_fetch_btn_bg', 'Fetch Button BG Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_fetch_btn_bg', 'type' => 'color', 'default' => '#0866ff']);
        add_settings_field('uvd_fetch_btn_text', 'Fetch Button Text Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_fetch_btn_text', 'type' => 'color', 'default' => '#ffffff']);
        add_settings_field('uvd_hd_btn_bg', 'HD Button BG Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_hd_btn_bg', 'type' => 'color', 'default' => '#0866ff']);
        add_settings_field('uvd_hd_btn_text', 'HD Button Text Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_hd_btn_text', 'type' => 'color', 'default' => '#ffffff']);
        add_settings_field('uvd_sd_btn_bg', 'SD Button BG Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_sd_btn_bg', 'type' => 'color', 'default' => '#f0f2f5']);
        add_settings_field('uvd_sd_btn_text', 'SD Button Text Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_sd_btn_text', 'type' => 'color', 'default' => '#1c1e21']);
        add_settings_field('uvd_spinner_color', 'Spinner Color', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_spinner_color', 'type' => 'color', 'default' => '#ffffff']);
        
        add_settings_field('uvd_placeholder_text', 'Input Placeholder', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_placeholder_text', 'type' => 'text', 'placeholder' => 'Paste Facebook Video URL here...']);
        add_settings_field('uvd_button_text', 'Fetch Button Text', [$this, 'render_input'], 'uvd-settings', 'uvd_appearance_section', ['id' => 'uvd_button_text', 'type' => 'text', 'placeholder' => 'Download']);
    }

    public function render_checkbox($args) {
        $val = get_option($args['id']);
        echo "<input type='checkbox' name='{$args['id']}' value='1' " . checked(1, $val, false) . " />";
    }

    public function render_input($args) {
        $default = isset($args['default']) ? $args['default'] : '';
        $val = get_option($args['id'], $default);
        $type = isset($args['type']) ? $args['type'] : 'text';
        $placeholder = isset($args['placeholder']) ? $args['placeholder'] : '';
        echo "<input type='$type' name='{$args['id']}' value='" . esc_attr($val) . "' placeholder='$placeholder' style='width: 300px;' />";
    }

    public function ad_code_render() {
        $val = get_option('uvd_ad_code');
        echo "<textarea name='uvd_ad_code' rows='8' cols='60' style='font-family: monospace;'>" . esc_textarea($val) . "</textarea>";
    }

    public function settings_page_html() {
        ?>
        <div class="wrap">
            <h1>FB Downloader Settings</h1>
            <form action='options.php' method='post'>
                <?php
                settings_fields('uvd_settings_group');
                do_settings_sections('uvd-settings');
                submit_button();
                ?>
            </form>
        </div>
        <?php
    }

    public function enqueue_scripts() {
        wp_enqueue_style('uvd-style', plugin_dir_url(__FILE__) . 'assets/css/style.css', [], '3.2.1');
        wp_enqueue_script('uvd-script', plugin_dir_url(__FILE__) . 'assets/js/script.js', ['jquery'], '3.2.1', true);
        
        wp_localize_script('uvd-script', 'uvd_ajax', [
            'ajax_url'      => admin_url('admin-ajax.php'),
            'nonce'         => wp_create_nonce('uvd_nonce'),
            'enable_ads_hd' => get_option('uvd_enable_ads_hd') ? true : false,
            'enable_ads_sd' => get_option('uvd_enable_ads_sd') ? true : false,
            'ad_code'       => get_option('uvd_ad_code', ''),
            'ad_delay'      => get_option('uvd_ad_delay', 2)
        ]);
    }

    public function shortcode_html() {
        $border_color = get_option('uvd_input_border_color', '#dddfe2');
        $fetch_bg     = get_option('uvd_fetch_btn_bg', '#0866ff');
        $fetch_color  = get_option('uvd_fetch_btn_text', '#ffffff');
        $hd_bg        = get_option('uvd_hd_btn_bg', '#0866ff');
        $hd_color     = get_option('uvd_hd_btn_text', '#ffffff');
        $sd_bg        = get_option('uvd_sd_btn_bg', '#f0f2f5');
        $sd_color     = get_option('uvd_sd_btn_text', '#1c1e21');
        $spinner_color = get_option('uvd_spinner_color', '#ffffff');
        
        $placeholder  = get_option('uvd_placeholder_text', 'Paste Facebook Video URL here...');
        $btn_text     = get_option('uvd_button_text', 'Download');

        ob_start();
        ?>
        <style>
            .uvd-main-wrapper #uvd-url-input { border-color: <?php echo esc_attr($border_color); ?> !important; }
            .uvd-main-wrapper #uvd-fetch-btn { background: <?php echo esc_attr($fetch_bg); ?> !important; color: <?php echo esc_attr($fetch_color); ?> !important; }
            .uvd-main-wrapper #uvd-fetch-btn:hover { filter: brightness(90%); }
            .uvd-main-wrapper .uvd-download-btn.hd { background: <?php echo esc_attr($hd_bg); ?> !important; border-color: <?php echo esc_attr($hd_bg); ?> !important; color: <?php echo esc_attr($hd_color); ?> !important; }
            .uvd-main-wrapper .uvd-download-btn.uvd-download-sd { background: <?php echo esc_attr($sd_bg); ?> !important; color: <?php echo esc_attr($sd_color); ?> !important; }
        </style>
        <div class="uvd-main-wrapper">
            <div class="uvd-form-row">
                <input type="text" id="uvd-url-input" placeholder="<?php echo esc_attr($placeholder); ?>" required />
                <button id="uvd-fetch-btn">
                    <span class="uvd-btn-text"><?php echo esc_html($btn_text); ?></span>
                    <span class="uvd-loader" style="display:none; width: 20px; height: 20px; border: 3px solid rgba(0,0,0,0.1); border-top: 3px solid <?php echo esc_attr($spinner_color); ?>; border-radius: 50%; vertical-align: middle; margin-left: 10px;"></span>
                </button>
            </div>
            <div id="uvd-error-container" style="display:none;"></div>
            <div id="uvd-result-container" style="display:none;"></div>
            
            <div id="uvd-ad-modal" class="uvd-modal-overlay" style="display:none;">
                <div class="uvd-modal-content">
                    <button id="uvd-close-ad" class="uvd-modal-close" style="display:none;">&times;</button>
                    <div id="uvd-ad-body"></div>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    private function clean_str($str) {
        return json_decode('"' . $str . '"');
    }

    public function handle_ajax_request() {
        check_ajax_referer('uvd_nonce', 'nonce');
        
        $url_input = isset($_POST['u']) ? $_POST['u'] : '';
        
        // Try decoding as base64 first
        $url = base64_decode($url_input, true);
        
        // If decoding failed or result is not a URL, fallback to raw input
        if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
            $url = $url_input;
        }
        
        $url = esc_url_raw($url);

        if (empty($url) || !preg_match('/(facebook\.com|fb\.watch)/', $url)) {
            wp_send_json_error(['message' => 'Please provide a valid Facebook video URL.']);
        }

        // The working connection logic
        $wp_args = [
            'timeout'    => 30,
            'redirection' => 5,
            'user-agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'headers'    => [
                'Accept'          => 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language' => 'en-US,en;q=0.9',
                'Cache-Control'   => 'no-cache',
                'Pragma'          => 'no-cache',
                'Cookie'          => 'm_pixel_ratio=1; wd=1920x1080;', // Ghost Cookie for bot bypass
                'Sec-Fetch-Dest'  => 'document',
                'Sec-Fetch-Mode'  => 'navigate',
                'Sec-Fetch-Site'  => 'none',
                'Sec-Fetch-User'  => '?1',
                'Upgrade-Insecure-Requests' => '1'
            ],
            'sslverify'  => false
        ];

        $response = wp_remote_get($url, $wp_args);
        if (is_wp_error($response)) {
            wp_send_json_error(['message' => 'Server Connectivity Issue. Please try again.']);
        }

        $body = wp_remote_retrieve_body($response);
        $video_data = [];

        // 1. Primary: OpenGraph Meta Tags (Most reliable for Public videos)
        if (preg_match('/property="og:video" content="([^"]+)"/', $body, $m)) {
            $video_data['sd'] = htmlspecialchars_decode($m[1]);
        } elseif (preg_match('/property="og:video:url" content="([^"]+)"/', $body, $m)) {
            $video_data['sd'] = htmlspecialchars_decode($m[1]);
        }

        // 2. Secondary: Exhaustive JSON Patterns
        $patterns = [
            'hd' => [
                '/browser_native_hd_url":"([^"]+)"/',
                '/"hd_src":"([^"]+)"/',
                '/"playable_url_quality_hd":"([^"]+)"/',
                '/hd_src_no_ratelimit":"([^"]+)"/',
                '/video_hd_url":"([^"]+)"/'
            ],
            'sd' => [
                '/browser_native_sd_url":"([^"]+)"/',
                '/"sd_src":"([^"]+)"/',
                '/"playable_url":"([^"]+)"/',
                '/sd_src_no_ratelimit":"([^"]+)"/',
                '/video_sd_url":"([^"]+)"/'
            ]
        ];

        foreach ($patterns['hd'] as $p) {
            if (preg_match($p, $body, $m)) {
                $video_data['hd'] = $this->clean_str($m[1]);
                break;
            }
        }

        if (empty($video_data['sd'])) {
            foreach ($patterns['sd'] as $p) {
                if (preg_match($p, $body, $m)) {
                    $video_data['sd'] = $this->clean_str($m[1]);
                    break;
                }
            }
        }

        if (empty($video_data)) {
            wp_send_json_error(['message' => 'Unable to find video source. Make sure the video is public.']);
        }

        if (preg_match('/<title>(.*?)<\/title>/', $body, $title_matches)) {
            $video_data['title'] = $this->clean_str($title_matches[1]);
        }

        wp_send_json_success($video_data);
    }
}
new UniversalVideoDownloader();
