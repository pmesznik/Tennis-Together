// Numer wersji wstrzykiwany przy buildzie w CI (patrz VITE_APP_VERSION w
// .github/workflows/android-debug-apk.yml i android-build.yml) — ten sam
// numer, jaki Android pokazuje w Ustawieniach przy aplikacji (appVersionName
// w android/app/build.gradle), więc łatwo porównać "co mam zainstalowane"
// z "co jest w apce". Lokalnie (npm run dev) ta zmienna nie jest ustawiona,
// więc pokazujemy wersję z package.json ze znacznikiem -dev.
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || "0.1.0-dev";
