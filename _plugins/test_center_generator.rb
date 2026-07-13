# 🌐 TyagiHub Test Center Engine — Dynamic Language & Unified Route Generation Matrix
# Path: _plugins/test_center_generator.rb
require 'json'

module TyagiHub
  class TestHubPage < Jekyll::Page
    def initialize(site, base, dir, filename, data_override, layout_name)
      @site = site
      @base = base
      @dir  = dir
      @name = filename

      self.process(@name)
      self.read_yaml(File.join(base, '_layouts'), layout_name)
      self.data.merge!(data_override)
    end
  end

  class TestCenterGenerator < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      qpp = 25 

      (site.config.dig('categories', 'english') || []).each do |cat|
        # इंग्लिश और हिंदी दोनों डेटा फाइलों को एक साथ लोड करके प्रश्न काउंट चेक करना
        questions_en = load_test_questions(site, cat['data_file'])
        
        # हिंदी काउंटरपार्ट ढूंढना (Same ID)
        hi_cats = site.config.dig('categories', 'hindi') || []
        hi_cat = hi_cats.find { |c| c['id'] == cat['id'] }
        
        # सुरक्षा जांच: अगर इंग्लिश में डेटा है तो उसे लें, वरना हिंदी का काउंट चेक करें
        total_questions = questions_en.size
        if total_questions == 0 && hi_cat
          questions_hi = load_test_questions(site, hi_cat['data_file'])
          total_questions = questions_hi.size
        end
        
        total_parts = total_questions > 0 ? (total_questions.to_f / qpp).ceil : 1
        hub_dir = "#{cat['id']}-test"
        
        # 1. मुख्य कैटेगरी हब पेज जेनरेट करना
        hub_data = {
          'layout' => 'default',
          'title' => "#{cat['title']} Mock Test Hub",
          'description' => "Practice free timed mock tests for #{cat['title']} with live leaderboards.",
          'category_id' => cat['id'],
          'category_title' => cat['title'],
          'category_title_hi' => hi_cat ? hi_cat['title'] : cat['title'],
          'total_questions' => total_questions,
          'total_parts' => total_parts,
          'permalink' => "/#{hub_dir}/"
        }
        site.pages << TestHubPage.new(site, site.source, hub_dir, 'index.html', hub_data, 'test-hub-layout.html')

        # 2. टेस्ट्स के प्लेयर पेज जेनरेट करना (सिंगल न्यूट्रल यूआरएल पाथ - टेस्ट सिन्क)
        total_parts.times do |p_idx|
          part_num = p_idx + 1
          test_str = part_num < 10 ? "test-0#{part_num}" : "test-#{part_num}"
          formatted_num = part_num < 10 ? "0#{part_num}" : part_num
          
          player_data = {
            'layout' => 'default',
            'title' => "#{cat['title']} - Test #{formatted_num} Live Test",
            'title_hi' => "#{hi_cat ? hi_cat['title'] : cat['title']} - टेस्ट #{formatted_num} लाइव टेस्ट",
            'quiz_id' => "#{cat['id']}-test-#{test_str}",
            'category_id' => cat['id'],
            'part_index' => part_num,
            'questions_per_page' => qpp,
            'permalink' => "/#{hub_dir}/#{test_str}/"
          }
          
          site.pages << TestHubPage.new(site, site.source, "#{hub_dir}/#{test_str}", 'index.html', player_data, 'test-player-layout.html')
        end
      end
    end

    private

    def load_test_questions(site, data_file)
      return [] if data_file.nil?
      parts = data_file.split('/')
      data  = site.data
      parts.each { |p| data = data[p] rescue nil; break if data.nil? }
      data.is_a?(Array) ? data : []
    end
  end
end
