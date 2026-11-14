import "./index.css";
import "./app/i18n";
import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./app/store";
import { ThemeProvider } from "./app/theme/ThemeProvider";
import { MOCK_API } from "./mocks/enabled";

async function startMockApi() {
  if (!MOCK_API) return;
  const { worker } = await import("./mocks/browser");
  await worker.start({ onUnhandledRequest: "bypass", quiet: true });
}

void startMockApi().then(() =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <Provider store={store}>
        <ThemeProvider>
          <App />
          <Toaster
            toastOptions={{
              className:
                "!bg-popover !text-popover-foreground !border !text-sm",
            }}
          />
        </ThemeProvider>
      </Provider>
    </React.StrictMode>,
  ),
);
