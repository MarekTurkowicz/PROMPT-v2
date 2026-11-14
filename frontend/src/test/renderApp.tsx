import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "@/App";
import i18n from "@/app/i18n";
import { makeStore } from "@/app/store";
import { ThemeProvider } from "@/app/theme/ThemeProvider";

export function renderApp(path: string) {
  return render(
    <Provider store={makeStore()}>
      <ThemeProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>,
  );
}

export const t = (key: string, params?: Record<string, unknown>) =>
  String(i18n.t(key as never, params as never));
