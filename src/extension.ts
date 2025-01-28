import * as vscode from 'vscode';
import axios, { AxiosError } from 'axios';

// Stałe konfiguracyjne
const DEFAULT_MODEL = 'deepseek-chat';
const API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

class DeepSeekAPI {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async getApiKey(): Promise<string | undefined> {
        return this.context.secrets.get('deepseekApiKey');
    }

    async setApiKey(apiKey: string): Promise<void> {
        await this.context.secrets.store('deepseekApiKey', apiKey);
    }

    async clearApiKey(): Promise<void> {
        await this.context.secrets.delete('deepseekApiKey');
    }

    async generateText(prompt: string): Promise<string> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            throw new Error('API key not configured');
        }

        try {
            const response = await axios.post(API_ENDPOINT, {
                model: DEFAULT_MODEL,
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                timeout: 30000
            });

            return response.data.choices[0].message.content;
        } catch (error) {
            const axiosError = error as AxiosError;
            throw new Error(`API request failed: ${axiosError.response?.status} ${axiosError.message}`);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    const deepseek = new DeepSeekAPI(context);

    // Command: Ask DeepSeek
    const askCommand = vscode.commands.registerCommand('deepseek.query', async () => {
        const editor = vscode.window.activeTextEditor;
        let initialPrompt = '';
        
        if (editor) {
            const selection = editor.document.getText(editor.selection);
            if (selection) {
                initialPrompt = `Context:\n\`\`\`\n${selection}\n\`\`\`\n\nQuestion: `;
            }
        }

        const prompt = await vscode.window.showInputBox({
            prompt: "Enter your question for DeepSeek",
            placeHolder: "Type your question here...",
            value: initialPrompt,
            validateInput: text => text.trim() ? null : "Question cannot be empty"
        });

        if (!prompt) return;

        const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        status.text = "$(sync~spin) Contacting DeepSeek...";
        status.show();

        try {
            const answer = await deepseek.generateText(prompt);
            
            const panel = vscode.window.createWebviewPanel(
                'deepseekResponse',
                'DeepSeek Response',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            panel.webview.html = getWebviewContent(answer);
            
            // Add copy to clipboard button
            panel.webview.onDidReceiveMessage(async message => {
                if (message.command === 'copy') {
                    await vscode.env.clipboard.writeText(answer);
                    vscode.window.showInformationMessage('Copied to clipboard!');
                }
            });

        } catch (error) {
            vscode.window.showErrorMessage(`DeepSeek Error: ${error instanceof Error ? error.message : error}`);
        } finally {
            status.dispose();
        }
    });

    // Command: Set API Key
    const setKeyCommand = vscode.commands.registerCommand('deepseek.setApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: "Enter DeepSeek API Key",
            password: true,
            ignoreFocusOut: true,
            validateInput: text => text ? null : "API key cannot be empty"
        });

        if (apiKey) {
            await deepseek.setApiKey(apiKey);
            vscode.window.showInformationMessage('API key saved successfully!');
        }
    });

    // Command: Clear API Key
    const clearKeyCommand = vscode.commands.registerCommand('deepseek.clearApiKey', async () => {
        await deepseek.clearApiKey();
        vscode.window.showInformationMessage('API key removed successfully!');
    });

    context.subscriptions.push(
        askCommand,
        setKeyCommand,
        clearKeyCommand
    );
}

function getWebviewContent(answer: string): string {
    const sanitizedAnswer = answer
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>DeepSeek Response</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell;
                padding: 1rem;
                line-height: 1.6;
            }
            pre {
                white-space: pre-wrap;
                background: #f5f5f5;
                padding: 1rem;
                border-radius: 4px;
            }
            .copy-button {
                position: fixed;
                top: 1rem;
                right: 1rem;
                padding: 0.5rem 1rem;
                background: #007acc;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <h1>DeepSeek Response</h1>
        <pre>${sanitizedAnswer}</pre>
        <button class="copy-button" onclick="copyToClipboard()">Copy to Clipboard</button>
        <script>
            const vscode = acquireVsCodeApi();
            function copyToClipboard() {
                vscode.postMessage({ command: 'copy' });
            }
        </script>
    </body>
    </html>`;
}

export function deactivate() {}