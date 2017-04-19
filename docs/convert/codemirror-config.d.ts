import * as CodeMirror from 'codemirror';

declare module 'codemirror' {
    interface EditorConfiguration {
        matchBrackets?: boolean;
        foldGutter?: boolean;
        minFoldSize?: number;
    }
}
