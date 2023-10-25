# athena-cli

Athena is a Quiz Web Application that automates the process of fetching questions from IndiaBIX, saving users valuable time. This web app allows users to input multiple URLs to answer questions in bulk.

## ⚠️ Note: Memory Considerations and Usage Recommendations

Please be aware that athena-cli might encounter compatibility issues on certain systems. While it allows for the processing of multiple URLs, it's crucial to ensure compatibility with your system before running multiple URLs. If athena-cli encounters compatibility issues, you might consider using the athena-docker version. However, please be aware that the athena-docker may not be compatible with all systems due to Docker's limited memory allocation and other constraints.

## :pushpin: Instructions

### Step 1: Clone and Run

First, clone the repository and navigate to the project directory:

```bash
git clone <repository_URL>
cd athena-cli
```

### Step 2: Install Dependencies

Next, install the required dependencies using the following command:

```bash
pip install -r requirements.txt
```

### Step 3: Run Athena-CLI and Initiate Local Server

Open a terminal or command prompt window, navigate to the athena-cli directory, and run the following command to start Athena-CLI:

```bash
python main.py
```

Next, open another terminal or command prompt and initiate a local server using the following command:

```bash
python -m http.server 8000
```
### Step 4: Input URLs

Make sure to input URLs in the following format: **`[base_url]`**, **`[start_url]`**, **`[end_url]`**. For example, if you have Section 1 of the topic Networks Analysis and Synthesis under Electronics and Communication Engineering, you'll have this link:

```bash
https://www.indiabix.com/electronics-and-communication-engineering/networks-analysis-and-synthesis/026001
```

Typically, the start page has a URL number of `026001`, and the end page has a URL number of `026010` (indicating that the section has 10 pages). Therefore, you'll input it as follows:

```bash
https://www.indiabix.com/electronics-and-communication-engineering/networks-analysis-and-synthesis/, 026001, 026010
```

In this one URL, you’ll have a total of 50 questions loaded to the web app, as each URL number in IndiaBIX typically has 5 questions. This feature will save you time and help you focus on the questions with the added features.

## :boom: Features

### Study Mode

- **Reset Button:** Reset questions to question number 1 and removes selected options.
- **Shuffle Button:** Changes the order of questions.
- **Favorites Button:** Mark and revisit favorited questions.
- **Search Button:** Navigate through questions.

### Quiz Mode

In quiz mode, it's quite similar to Study Mode, but with additional features. These additional features in Quiz Mode include:

- **Scoring system** 
- **Review of incorrect questions** 
- **Selection of answered and unanswered questions from the dropdown menu** 

## :camera: Sample Screenshots

### Study Mode

![Study Mode Sample](study_mode_sample.png?raw=true "Study Mode Sample")

### Quiz Mode

![Quiz Mode Sample](quiz_mode_sample.png?raw=true "Quiz Mode Sample")

If you encounter issues or have suggestions, feel free to contribute. Don't forget to :star2: this project if it helped you. I created this app to help with my preparation for the electronics engineering board exam in the Philippines.