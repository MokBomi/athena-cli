# Imports
import os
import re
import time
import json
import ssl
import warnings
import urllib3
from random import choice
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Constants and initializations
ssl._create_default_https_context = ssl._create_unverified_context
warnings.filterwarnings("ignore", category=urllib3.exceptions.InsecureRequestWarning)
question_counter = 1
question_data = []
favorite_questions = []
session = requests.Session()

# Flask routes
@app.route('/', methods=['GET'])
def home():
    return {"status": "success", "message": "Your application is running. Use /startScraping endpoint to start scraping."}

@app.route('/startScraping', methods=['POST'])
def start_scraping():
    # Function to start the scraping process
    global question_counter, question_data, favorite_questions
    data = request.json
    question_counter = 1
    question_data = []
    favorite_questions = []
    try:
        for url_set in data['urls']:
            base_url = url_set['base_url']
            start_url = int(url_set['start_url'])
            end_url = int(url_set['end_url'])
            for url_number in range(start_url, end_url + 1):
                question_counter = process_question(base_url, url_number, question_counter)
    except Exception as e:
        print(f"Error occurred during scraping: {e}")
    finally:
        with open('./data/questions.json', 'w') as f:
            json.dump(question_data, f)
        with open('./data/favorites.json', 'w') as f:
            json.dump(favorite_questions, f)
    return jsonify({"message": "Scraping completed."}), 200

@app.route('/getQuestions', methods=['GET'])
def get_questions():
    # Function to get the stored questions
    global question_counter
    with open('./data/questions.json', 'r') as f:
        questions_data = json.load(f)

    for idx, question in enumerate(questions_data):
        question["id"] = idx

    question_counter = len(questions_data) + 1
    return jsonify(questions_data)

@app.route('/getFavorites', methods=['GET'])
def get_favorites():
    # Function to get the stored favorite questions
    return jsonify(favorite_questions)

@app.route('/toggleFavorite', methods=['POST'])
def toggle_favorite():
    # Function to toggle the status of a favorite question
    global favorite_questions
    question_id = request.json['question_id']
    favorite_status = request.json['favorite_status']

    if favorite_status and question_id not in favorite_questions:
        favorite_questions.append(question_id)
    elif not favorite_status and question_id in favorite_questions:
        favorite_questions.remove(question_id)

    with open('./data/favorites.json', 'w') as f:
        json.dump(favorite_questions, f)

    return jsonify({"message": "Success"}), 200

# Helper functions
def download_image(img_url, path, name):
    # Function that downloads and saves an image from a URL
    if not os.path.exists(path):
        os.makedirs(path)

    response = requests.get(img_url, stream=True, verify=False)
    with open(os.path.join(path, name), 'wb') as out_file:
        out_file.write(response.content)

# Dictionary for image types
img_type_directory = {
    "within": "Within",
    "after": "After",
    "option": "Option"
}

# List of User-Agent strings
headers_list = [
    "Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"
]

# Function to process a question from a given URL
def process_question(base_url, url_number, question_counter):
    global question_data
    url = base_url + str(url_number).zfill(6)
    MAX_RETRIES = 10
    backoff_time = 3  

    for attempt in range(MAX_RETRIES):
        try:
            time.sleep(backoff_time * attempt) 
            page = session.get(url, headers={'User-Agent': choice(headers_list)}, verify=False)
            page.raise_for_status()
            break
        except requests.RequestException as request_exception:
            print(f'Error occurred for {url}, waiting for {backoff_time * attempt} secs before retrying.....')
            if attempt == MAX_RETRIES - 1: 
                print(f"Error fetching {url} after {MAX_RETRIES} attempts, Error: {request_exception}")
                return question_counter 
            continue   
        except Exception as err:
            print(f'An error occurred: {err}')
            return
    else:
        return

    soup = BeautifulSoup(page.content, 'html.parser')
    questions = soup.find_all('div', class_='bix-div-container')

    for question in questions:
        try:
            # Extract question details
            q_text_elem = question.find('div', class_='bix-td-qtxt')
            options_elems = question.find_all('div', class_='bix-td-option-val')
            answer_elem = question.find('input', class_='jq-hdnakq')

            # Extract question text, options, and answer
            question_text = str(q_text_elem).strip() if q_text_elem else 'Question not found.'
            options = [option_elem.text.strip() for option_elem in options_elems] if options_elems else ['No options found.']
            answer = answer_elem['value'].upper() if answer_elem else 'Answer not found.'
            if answer not in ['A', 'B', 'C', 'D']:
                raise ValueError('Invalid answer.')
            answer = f"Option {answer}" if answer != 'Answer not found.' else answer

            # Download Images Logic
            if not os.path.exists('./static/assets/images/background'):
                os.makedirs('./static/assets/images/background')

            img_count = {'within': 1, 'after': 1}  # Image counters         
            img_elems = q_text_elem.find_all('img')

            for img_elem in img_elems:
                img_url = urljoin(url, img_elem['src'])

                img_data = str(img_elem.previous) if img_elem.previous else ""
                img_data = re.sub(r'\s+', '', img_data)

                name_type = 'after' if '<br/>' in img_data else 'within'

                if name_type == 'within':
                    placeholder = f'(image)q{question_counter}_within_{img_count.get("within", 1)}(image)'
                    question_text = question_text.replace(str(img_elem), placeholder)
                elif name_type == 'after':
                    placeholder = f'(image)q{question_counter}_after_{img_count.get("after", 1)}(image)'
                    question_text = question_text.replace(str(img_elem), placeholder)

                name = f'q{question_counter}_{name_type}_{img_count.get(name_type, 1)}.png'
                folder_path = os.path.join('./static/assets/images/background', img_type_directory[name_type])

                download_image(img_url, folder_path, name)  
                img_count[name_type] = img_count[name_type] + 1

            options = []
            for i, option_elem in enumerate(options_elems):
                flex_wrap_div = option_elem.find('div', class_='flex-wrap') 
                if not flex_wrap_div:
                    options.append('Option not found')
                    continue
                        
                img_options = flex_wrap_div.find_all('img') 
                option_img_count = 1
                if img_options:
                    for img_option in img_options:
                        img_url = urljoin(url, img_option['src'])
                        option_name = chr(ord('A') + i)
                        name = f'q{question_counter}_option{option_name}_{option_img_count}.png' 
                        folder_path = os.path.join('./static/assets/images/background', img_type_directory["option"])
            
                        placeholder = f'<img src="/static/assets/images/background/Option/{name}" alt="{name}" style="display: inline-block; width: auto; height: auto;">'
                        flex_wrap_div = BeautifulSoup(flex_wrap_div.decode().replace(str(img_option), placeholder), 'html.parser')
            
                        download_image(img_url, folder_path, name)
                        option_img_count += 1
            
                option_text = flex_wrap_div.decode_contents().strip()

                # Logic for handling <span class="root"></span>
                root_span = re.search('<span class="root">(.*?)</span>', option_text)
                if root_span:
                    option_text = re.sub(root_span.group(), f'√({root_span.group(1).strip()})', option_text)

                options.append(option_text)

            # Append the processed question to the question_data list
            question_data.append({'question': question_text, 'options': options, 'answer': answer})

            # Print the question and its details for verification
            print(f"\nQuestion No. {question_counter}: {question_text}")
            print("Options: \n{}".format('\n'.join(options)))
            print(answer)
            question_counter += 1

        except Exception as e:
            print(f"Error occurred while processing question: {e}")

    return question_counter

# Run the Flask app
if __name__ == "__main__":
    try:
        with open('./data/favorites.json', 'r') as f:
            favorite_questions = json.load(f)
    except FileNotFoundError:
        favorite_questions = []
    app.run(debug=True)
