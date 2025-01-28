"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
// Stałe konfiguracyjne
const DEFAULT_MODEL = 'deepseek-chat';
const API_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
class DeepSeekAPI {
    constructor(context) {
        this.context = context;
    }
    getApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.context.secrets.get('deepseekApiKey');
        });
    }
    setApiKey(apiKey) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.context.secrets.store('deepseekApiKey', apiKey);
        });
    }
    clearApiKey() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.context.secrets.delete('deepseekApiKey');
        });
    }
    generateText(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const apiKey = yield this.getApiKey();
            if (!apiKey) {
                throw new Error('API key not configured');
            }
            try {
                const response = yield axios_1.default.post(API_ENDPOINT, {
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
            }
            catch (error) {
                const axiosError = error;
                throw new Error(`API request failed: ${(_a = axiosError.response) === null || _a === void 0 ? void 0 : _a.status} ${axiosError.message}`);
            }
        });
    }
}
function activate(context) {
    const deepseek = new DeepSeekAPI(context);
    // Command: Ask DeepSeek
    const askCommand = vscode.commands.registerCommand('deepseek.query', () => __awaiter(this, void 0, void 0, function* () {
        const editor = vscode.window.activeTextEditor;
        let initialPrompt = '';
        if (editor) {
            const selection = editor.document.getText(editor.selection);
            if (selection) {
                initialPrompt = `Context:\n\`\`\`\n${selection}\n\`\`\`\n\nQuestion: `;
            }
        }
        const prompt = yield vscode.window.showInputBox({
            prompt: "Enter your question for DeepSeek",
            placeHolder: "Type your question here...",
            value: initialPrompt,
            validateInput: text => text.trim() ? null : "Question cannot be empty"
        });
        if (!prompt)
            return;
        const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        status.text = "$(sync~spin) Contacting DeepSeek...";
        status.show();
        try {
            const answer = yield deepseek.generateText(prompt);
            const panel = vscode.window.createWebviewPanel('deepseekResponse', 'DeepSeek Response', vscode.ViewColumn.Beside, {
                enableScripts: true,
                retainContextWhenHidden: true
            });
            panel.webview.html = getWebviewContent(answer);
            // Add copy to clipboard button
            panel.webview.onDidReceiveMessage((message) => __awaiter(this, void 0, void 0, function* () {
                if (message.command === 'copy') {
                    yield vscode.env.clipboard.writeText(answer);
                    vscode.window.showInformationMessage('Copied to clipboard!');
                }
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage(`DeepSeek Error: ${error instanceof Error ? error.message : error}`);
        }
        finally {
            status.dispose();
        }
    }));
    // Command: Set API Key
    const setKeyCommand = vscode.commands.registerCommand('deepseek.setApiKey', () => __awaiter(this, void 0, void 0, function* () {
        const apiKey = yield vscode.window.showInputBox({
            prompt: "Enter DeepSeek API Key",
            password: true,
            ignoreFocusOut: true,
            validateInput: text => text ? null : "API key cannot be empty"
        });
        if (apiKey) {
            yield deepseek.setApiKey(apiKey);
            vscode.window.showInformationMessage('API key saved successfully!');
        }
    }));
    // Command: Clear API Key
    const clearKeyCommand = vscode.commands.registerCommand('deepseek.clearApiKey', () => __awaiter(this, void 0, void 0, function* () {
        yield deepseek.clearApiKey();
        vscode.window.showInformationMessage('API key removed successfully!');
    }));
    context.subscriptions.push(askCommand, setKeyCommand, clearKeyCommand);
}
function getWebviewContent(answer) {
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
function deactivate() { }
//# sourceMappingURL=extension.js.map