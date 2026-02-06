# HiNote - Your Local-First Web Highlighter & Knowledge Base

HiNote is a browser extension that acts as your personal, privacy-focused knowledge base. Effortlessly highlight text on any webpage, attach notes, and manage your insights locally. It's designed for researchers, students, and anyone who wants to build a personal library of web content without relying on cloud services.

## Key Features

- **Seamless Highlighting**: Create persistent highlights on any webpage with a simple text selection.
- **Note Taking**: Attach rich-text notes to your highlights using a clean, Tiptap-powered editor.
- **Local-First Storage**: All your data is stored securely on your own device in IndexedDB. You own your data.
- **Powerful Side Panel**: A dedicated side panel provides a global view of all your notes, with search and filtering capabilities.
- **AI-Powered Actions**: Connect your own OpenAI, Google Gemini, or Anthropic API keys to unlock AI features like summarization and question-answering for your notes. Your keys are stored locally and never leave your browser.
- **Cross-Browser Support**: Works on both Google Chrome and Mozilla Firefox.
- **Data Portability**: Full data export and import functionality, allowing you to back up or migrate your knowledge base.

## Tech Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite with `@crxjs/vite-plugin` for streamlined extension development
- **Database**: IndexedDB managed via Dexie.js
- **Styling**: Tailwind CSS
- **Rich Text Editor**: Tiptap
- **AI Integration**: LangChain.js
- **Cross-Browser APIs**: `webextension-polyfill`

## Getting Started

To get started with development, clone the repository and install the dependencies.

```bash
# Clone the repository
git clone <repository-url>
cd hinote

# Install dependencies
npm install
```

### Development

To start the development server with hot-reloading for a better developer experience:

```bash
npm run dev
```

Then, load the extension in your browser:

1.  **Chrome**:
    - Go to `chrome://extensions`
    - Enable "Developer mode"
    - Click "Load unpacked"
    - Select the `dist` folder in the project directory.
2.  **Firefox**:
    - Go to `about:debugging`
    - Click "This Firefox"
    - Click "Load Temporary Add-on..."
    - Select the `dist/manifest.json` file.

The extension will automatically reload as you make changes to the code.

## Building for Production

To create an optimized production build of the extension, use the following commands.

### For Google Chrome

This command builds the extension in the `dist` directory, ready to be zipped and uploaded to the Chrome Web Store.

```bash
npm run build
```

_(Note: `npm run build:chrome` is also available and is an alias for `npm run build`)_

### For Mozilla Firefox

This command first runs the standard build and then overwrites the manifest with the Firefox-specific version (`manifest.firefox.json`).

```bash
npm run build:firefox
```

The output will be in the `dist` directory, ready for packaging and submission to the Firefox Add-ons store.
