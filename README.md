# DeepSeek-VS

DeepSeekVS is a VS Code extension that integrates DeepSeek API functionalities directly into the editor. It allows developers to interact with DeepSeek models for AI-driven assistance, making coding and problem-solving more efficient.

![DeepSeek-VS](images/icon.jpeg)

---

## Features

- **Query DeepSeek**: Select text in the editor and send it to DeepSeek for AI-generated insights.
- **Set API Key**: Configure your API key for authentication.
- **Supports Multiple Models**: Choose from `deepseek-chat`, `deepseek-coder`, and `deepseek-math` models.
- **Seamless Integration**: Works directly in VS Code with an intuitive interface.

---

## Installation

### Prerequisites
- VS Code `^1.75.0`
- Node.js `^20.11.0`
- TypeScript `^5.3.3`

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/notlikejuice/deepseek-helper.git
   cd deepseek-helper
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the extension:
   ```bash
   npm run compile
   ```
4. Package the extension:
   ```bash
   npm run package
   ```
5. Install in VS Code:
   ```bash
   code --install-extension deepseek-helper-0.0.3.vsix
   ```

---

## Usage

1. **Query DeepSeek**
   - Select text in the editor.
   - Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
   - Run `DeepSeek: Ask DeepSeek`.
   - View the AI-generated response.

2. **Set API Key**
   - Open the command palette.
   - Run `DeepSeek: Set the API key`.
   - Enter your API key when prompted.

---

## Configuration

Modify settings in VS Code preferences (`settings.json`):
```json
{
  "deepseekHelper.defaultModel": "deepseek-chat"
}
```

---

## Contributing

Contributions are welcome! Follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/your-feature`).
3. Commit and push your changes.
4. Open a Pull Request.

---

## License

DeepSeek Helper is licensed under the GNU General Public License v3.0. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

- Built with [VS Code API](https://code.visualstudio.com/api).
- Inspired by AI-driven development tools.
- API integration powered by [DeepSeek](https://deepseek.com).

---

## Troubleshooting

- **Issue**: API key not set.  
  **Solution**: Run `DeepSeek: Set the API key` in the command palette.

- **Issue**: Query response is empty.  
  **Solution**: Ensure DeepSeek API is accessible and verify your internet connection.

For further assistance, open an issue in the [repository](https://github.com/notlikejuice/deepseek-helper/issues).

