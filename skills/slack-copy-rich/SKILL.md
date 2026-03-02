---
name: slack-copy-rich
description: Copy output to clipboard as rich text for Slack
allowed-tools: Bash(echo *), Bash(uname*), Bash(which *)
---

## Your task

Take the most recent assistant output (or the content the user specifies: $ARGUMENTS) and copy it to the clipboard as rich text suitable for pasting into Slack, email, or other rich text editors.

## Steps

1. **Identify the content to copy.** Use the most recent assistant output unless the user specifies something else via $ARGUMENTS.

2. **Convert the markdown to simple HTML:**
   - Bold headers (`<b>` tags)
   - Bullet lists (`<ul>/<li>` tags)
   - Links (`<a href="...">` tags)
   - Inline code with monospace styling (`<code style="background:#f0f0f0;padding:2px 4px;border-radius:3px;font-family:monospace;">`)
   - Code blocks with preformatted styling (`<pre style="background:#f0f0f0;padding:8px;border-radius:4px;font-family:monospace;">`)
   - Paragraphs separated by `<br>` tags

3. **Escape single quotes** in the HTML by replacing `'` with `&#39;`.

4. **Detect the OS and copy to clipboard as rich text:**

   First detect the platform:
   ```bash
   uname -s
   ```

   ### macOS
   ```bash
   echo '<html content here>' | hexdump -ve '1/1 "%.2x"' \
     | xargs printf 'set the clipboard to {text:" ", «class HTML»:«data HTML%s»}' | osascript -
   ```
   This sets the `«class HTML»` pasteboard type so it pastes as formatted rich text.

   ### Linux (X11 — Fedora, Ubuntu, etc.)
   Requires `xclip`. If not installed, tell the user to run `sudo dnf install xclip` (Fedora) or `sudo apt install xclip` (Debian/Ubuntu).
   ```bash
   echo '<html content here>' | xclip -selection clipboard -t text/html
   ```
   This sets the `text/html` MIME type on the X11 clipboard so it pastes as rich text in Slack, browsers, and email clients.

   ### Linux (Wayland — Fedora 43 default)
   Requires `wl-copy` from `wl-clipboard`. If not installed, tell the user to run `sudo dnf install wl-clipboard` (Fedora) or `sudo apt install wl-clipboard` (Debian/Ubuntu).
   ```bash
   echo '<html content here>' | wl-copy --type text/html
   ```

   **How to choose between X11 and Wayland:** Check `echo $XDG_SESSION_TYPE`. If it says `wayland`, use `wl-copy`. If it says `x11`, use `xclip`.

5. **Replace** `<html content here>` with the actual HTML generated from the markdown.

6. **Confirm** to the user that the content has been copied to the clipboard as rich text, and mention which clipboard method was used.
