import os
import re

# Configuration
base_dir = r"c:\MySrc\ConceptCrafter"
output_file = os.path.join(base_dir, "ConceptCrafter_Single.html")
original_html = os.path.join(base_dir, "ConceptCrafter.html")
css_file = os.path.join(base_dir, "styles.css")

js_files = [
    "utils/helpers.js",
    "models/Node.js",
    "models/Connection.js",
    "models/Frame.js",
    "services/ProjectManager.js",
    "services/ExportService.js",
    "components/Canvas.js",
    "components/Toolbar.js",
    "components/Sidebar.js",
    "app.js"
]

def read_file(path):
    with open(os.path.join(base_dir, path), 'r', encoding='utf-8') as f:
        return f.read()

def process_js(content, filename):
    # Remove imports
    content = re.sub(r'^import .*?;\s*$', '', content, flags=re.MULTILINE)
    # Remove exports
    content = re.sub(r'^export ', '', content, flags=re.MULTILINE)
    
    # Special handling for ExportService.js
    if "ExportService.js" in filename:
        # Replace loadStyles method
        old_method = r"async loadStyles\(\) \{[\s\S]*?catch \(error\) \{[\s\S]*?\}[\s\S]*?\}"
        new_method = """loadStyles() {
        const styleTag = document.querySelector('head > style');
        if (styleTag) {
            this.styles = styleTag.textContent;
        }
    }"""
        content = re.sub(old_method, new_method, content)
        
    return content

def main():
    try:
        # Read HTML template
        html_content = read_file("ConceptCrafter.html")
        
        # Extract head and body parts
        # We want to keep everything except the <link rel="stylesheet"> and <script type="module">
        
        # Remove stylesheet link
        html_content = re.sub(r'<link rel="stylesheet" href="styles.css">', '', html_content)
        
        # Remove module script
        html_content = re.sub(r'<script type="module" src="app.js"></script>', '', html_content)
        
        # Read CSS
        css_content = read_file("styles.css")
        
        # Read and process JS
        full_js = ""
        for js_file in js_files:
            js_content = read_file(js_file)
            processed_js = process_js(js_content, js_file)
            full_js += f"\n// ----- {js_file} -----\n"
            full_js += processed_js + "\n"

        # Assemble new HTML
        # Insert CSS into head
        style_tag = f"<style>\n{css_content}\n</style>"
        html_content = html_content.replace("</head>", f"{style_tag}\n</head>")
        
        # Insert JS at the end of body
        script_tag = f"<script>\n{full_js}\n</script>"
        html_content = html_content.replace("</body>", f"{script_tag}\n</body>")
        
        # Write output
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        print(f"Successfully created {output_file}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
