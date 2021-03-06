# File-Header-Comment Helper for Visual Studio Code
This is a, super-simple, extension for [Visual Studio Code](https://code.visualstudio.com/) that was created to simplify the task of adding file-header-comments to source files.

## What good is this?
Adding file-header-comments is easy, and is done quite a bit by us programmers, so, why can't the machine help, and do some of the work for us?

Before this extension, pretty much every time I created a file, I'd add a file-header-comment, doing one of the following...

 - Copy an existing comment, and replace certain values
 - Write a whole new comment, from scratch

Neither of the items listed, are difficult, and they don't take much time, however, when you're really in the zone as a programmer, you probably don't want to have to deal with something as silly as a file-header-comment.

What this extension does, is take advantage of Visual Studio Code's (quite powerful) extension framework, along with its configuration system, to provide a simple(r) system to help you create file-header-comments.

The question "what good is this", cannot really be answered, because the "answer" to it, will always be an opinion.

Yes, I also have an opinion about this extension, but I won't offer-it-up, because I created the extension, which, in turn, means I'm probably biased.

### **tl;dr**: You'll have to try this, and "answer" that question for yourself.

## How do I use this? (In 10 easy steps)
**Note**: This section makes the assumption that you have a working installation of Visual Studio Code, and are mildly familiar with it. If you aren't, perhaps you should start [here](https://code.visualstudio.com/Docs).

### Step 0: Open a project in Visual Studio Code
### Step 1: Launch the "Quick Open" Interface (`Ctrl/Cmd + P`)
### Step 2: Install the extension using "`ext install vscode-file-header-comment-helper`"
### Step 3: Restart VS Code when prompted
### Step 4: Open your user [or workspace] settings file ([reference](https://code.visualstudio.com/Docs/customization/userandworkspace))
### Step 5: Add the "`fileHeaderCommentHelper.languageConfigs`" property to your settings (see below)
### Step 6: Add per-language file-header-comment templates (see below)
### Step 7: Open a file [from the project you just opened]
### Step 8: Re-Launch the "Quick Open" Interface (`Ctrl/Cmd + P`)
### Step 9: Run the extension using "`> Insert File-Header-Comment`"

#### Example `settings.json` file, with extension configuration:
```json
// Place your settings in this file to overwrite the default settings
{
    "fileHeaderCommentHelper.languageConfigs": {
        "language_javascript": {
            "template": [
                "/*",
                " * Project: $(projectName)",
                " * File: $(currentFile)",
                " */"
            ]
        }
    }
}
```

## License
This extension is released under an MIT License (just like [Visual Studio Code](https://code.visualstudio.com/)).

A copy of the license, can be found [here](https://github.com/Gigabyte-Giant/vscode-file-header-comment-helper/blob/master/LICENSE).