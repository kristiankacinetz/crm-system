import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "./app.css";
import "dayjs/locale/sk";

import { Alert, Center, Loader, MantineProvider, createTheme } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { initTauriDb } from "./db/tauri";
import { dailyInvoiceAlert } from "./services/alerts";
import { autoBackup } from "./services/backup";
import { errorMessage } from "./ui/useAsync";

const theme = createTheme({ primaryColor: "blue", defaultRadius: "md" });

function Root() {
  const [state, setState] = useState<"loading" | "ready" | string>("loading");
  useEffect(() => {
    initTauriDb()
      .then(() => {
        setState("ready");
        // Background tasks must never block the UI.
        void autoBackup().catch((e) => console.error("Záloha zlyhala", e));
        void dailyInvoiceAlert().catch((e) => console.error("Upozornenie zlyhalo", e));
      })
      .catch((e) => setState(errorMessage(e)));
  }, []);
  if (state === "loading")
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  if (state !== "ready")
    return (
      <Center h="100vh" p="xl">
        <Alert color="red" title="Databázu sa nepodarilo otvoriť">
          {state}
          <br />
          Aplikáciu spúšťajte cez <code>npm run tauri dev</code> alebo nainštalovaný program.
        </Alert>
      </Center>
    );
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: "sk", firstDayOfWeek: 1 }}>
        <ModalsProvider>
          <Notifications position="top-right" />
          <HashRouter>
            <Root />
          </HashRouter>
        </ModalsProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
);
