# athena-docker

Athena is a Quiz Web Application that automates the process of fetching questions from IndiaBIX, saving users valuable time. This web app allows users to input multiple URLs to answer questions in bulk. This version of the web app is designed for running within a Docker environment.

## ⚠️ Note: Memory Considerations and Usage Recommendations

Please be aware that although this Docker version of the repository is designed to work on most computers, Docker has a default memory allocation that can be insufficient for data-intensive tasks. Therefore, it is recommended to run this for a maximum of 1 URL initially. Increasing the memory allocation in the Docker application settings might allow for processing of up to 3 URLs, but it's crucial to experiment cautiously. Please note that a safety net of 1 or 2 URLs is recommended. If you intend to process a larger number of URLs, you might consider using the athena-cli. However, please be aware that the athena-cli may not be compatible with all systems.

## :pushpin: Instructions

### Step 1: Install Docker

Visit the [Docker website](https://www.docker.com/get-docker/) and follow the guidelines particular to your OS for installing Docker. If your operating system version does not support Docker Desktop, you may consider using [Docker Toolbox](https://docs.docker.com/toolbox/toolbox_install/) instead.

### Step 2: Clone and Run

After installing Docker, execute the following commands in your terminal:

```bash
git clone <repository_URL>
cd athena-docker
docker build -t quiz-app .
docker run -p 8000:8000 quiz-app
```

### Step 3: Input URLs

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
