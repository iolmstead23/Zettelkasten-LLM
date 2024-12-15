# Zettelkasten-LLM
Analysis and construction of Zettelkasten sysem using Large Language Models

### !! THIS HAS NOT BEEN DEVELOPED FOR MOBILE USE !!

[Live Demo](https://zettelkasten-llm.vercel.app/)

# Instructions

Run npm run dev to get started using the wep app in development mode after cloning.

# Intro
The intention of this project is to explore a Zettelkasten system indexed by markdown files. These markdown files are written using Obsidian as the editor. I recommend saving your vault to a Google Drive and also backing up your vault on local storage as well. These scripts run reports on the overall health of the Zettelkasten system, taking into consideration factors like the overall links-to-nodes ratio, sentiment analysis to understand tone (an important parameter to remember), and other latent quantifiable variables yet to be explored. This is the first level of functionality. The next level of functionality is the chatbot. It would be trained using large language model architecture.

The user would write short essays, which get labeled and indexed. There would be a function that checks reading comprehension and adjusts its speech to better synergize with the user. It's not about how much the user can do; it's about finding out how to provide an experience while never sacrificing control. Software should be intuitive.

# Features Overview

The dashboard for the app will include multiple features to use. The Filetree will keep track of the notes and allow for CRUD operations. The text editor will allow for editing/savings on notes.

![Screenshot 2024-12-13 233032](https://github.com/user-attachments/assets/390b1a44-bf75-4cc9-8669-fb625afcecef)

The Plot page includes the Plotly plot that will project and orientate the notes data in a 3d space.

![Screenshot 2024-12-13 235311](https://github.com/user-attachments/assets/97213785-14bf-4735-99f2-fa0f17dd0271)

# TODO
- Add custom sidebar width and allow it to be collapsible
- Enforce Unique file names
- Enforce 2 Layer Folder limit
- Add edge creation using Editor toolbar feature
- Store metrics such as last save and total word count
- Create a history journal to record CRUD and Editor actions
- Add logic for search bar, analytics page, and calendar
- Polish up styles for better UI/UX
- Add mobile support
- Integrate LLM into UI after framework is built
