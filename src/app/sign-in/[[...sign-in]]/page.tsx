import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#170910] bg-cover bg-center px-4 py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 3, 8, 0.42), rgba(15, 3, 8, 0.72)), url('/images/voltcity.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <a
            href="/"
            className="text-4xl font-black tracking-wider text-white"
          >
            VOLT<span className="text-rose-400">CAB</span>
          </a>

          <p className="mt-3 text-rose-100">
            Your journey starts here.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-rose-400/30 bg-[#240d17]/95 p-2 shadow-2xl shadow-rose-950/60 backdrop-blur-md">
         <SignIn
  routing="path"
  path="/sign-in"
  signUpUrl="/sign-up"
  forceRedirectUrl="/"
  appearance={{
    variables: {
      colorPrimary: "#be123c",
      colorBackground: "#240d17",
      colorText: "#ffffff",
      colorTextSecondary: "#ffffff",
      colorInputBackground: "#fff7f9",
      colorInputText: "#2b0a18",
      colorNeutral: "#ffffff",
    },
  }}
/>
  elements: {
    card: {
      backgroundColor: "transparent",
      boxShadow: "none",
      border: "none",
    },
    headerTitle: { color: "#ffffff" },
    headerSubtitle: { color: "#ffffff" },
    formFieldLabel: { color: "#ffffff" },
    formFieldInput: {
      color: "#2b0a18",
      backgroundColor: "#fff7f9",
      borderColor: "#e11d48",
    },
    formButtonPrimary: {
      backgroundColor: "#9f1239",
      color: "#ffffff",
    },
    socialButtonsBlockButton: {
      color: "#ffffff",
      borderColor: "#fb7185",
      backgroundColor: "#3b1020",
    },
    socialButtonsBlockButtonText: { color: "#ffffff" },
    dividerText: { color: "#ffffff" },
    footerActionText: { color: "#ffffff" },
    footerActionLink: { color: "#ffffff" },
    identityPreviewText: { color: "#ffffff" },
    formFieldHintText: { color: "#ffffff" },
    formFieldErrorText: { color: "#ffffff" },
    footer: { color: "#ffffff" },
  },
}}
          />
        </div>

        <p className="mt-6 text-center text-xs text-rose-100">
          VOLT CAB · RIDE INTO THE FUTURE
        </p>

        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-sm text-rose-200 transition hover:text-white"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}