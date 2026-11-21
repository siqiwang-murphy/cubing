(() => {
    const dialog = document.getElementById("account-dialog");
    const openButton = document.getElementById("open-account");
    const closeButton = document.getElementById("close-account-dialog");
    const title = document.getElementById("account-dialog-title");
    const description = document.getElementById("account-dialog-copy");
    const setupMessage = document.getElementById("account-setup");
    const formPanel = document.getElementById("account-form-panel");
    const sessionPanel = document.getElementById("account-session-panel");
    const form = document.getElementById("account-form");
    const usernameField = document.getElementById("account-username-field");
    const usernameInput = document.getElementById("account-username");
    const emailInput = document.getElementById("account-email");
    const passwordInput = document.getElementById("account-password");
    const passwordHint = document.getElementById("account-password-hint");
    const submitButton = document.getElementById("account-submit");
    const message = document.getElementById("account-message");
    const sessionSummary = document.getElementById("account-session-summary");
    const sessionMessage = document.getElementById("account-session-message");
    const signOutButton = document.getElementById("account-sign-out");
    const modeButtons = [...document.querySelectorAll("[data-account-mode]")];
    const usernamePattern = /^[A-Za-z0-9_]{3,20}$/;
    let accountMode = "signup";
    let supabaseClient = null;
    let accountUnavailableMessage = "";
    let profileRequestId = 0;
    let currentSession = null;
    let sessionInitialized = false;
    const sessionListeners = new Set();

    function showMessage(element, text, kind) {
        element.textContent = text;
        if (kind) element.dataset.kind = kind;
        else delete element.dataset.kind;
    }

    function onSessionChange(listener) {
        sessionListeners.add(listener);
        if (sessionInitialized) {
            const session = currentSession;
            window.setTimeout(() => listener(session), 0);
        }
        return () => sessionListeners.delete(listener);
    }

    async function loadProgress(userId) {
        if (!supabaseClient || !currentSession || currentSession.user.id !== userId) {
            throw new Error("Your account session changed. Sign in again to load progress.");
        }
        const { data, error } = await supabaseClient
            .from("cube_club_progress")
            .select("learning_statuses, custom_algorithms")
            .eq("user_id", userId)
            .maybeSingle();
        if (error) throw error;
        return data || { learning_statuses: {}, custom_algorithms: {} };
    }

    async function saveProgress(userId, progress) {
        if (!supabaseClient || !currentSession || currentSession.user.id !== userId) {
            throw new Error("Your account session changed. Sign in again to save progress.");
        }
        const { error } = await supabaseClient
            .from("cube_club_progress")
            .upsert({
                user_id: userId,
                learning_statuses: progress.learningStatuses,
                custom_algorithms: progress.customAlgorithms
            }, { onConflict: "user_id" });
        if (error) throw error;
    }

    window.CUBE_CLUB_ACCOUNT = { onSessionChange, loadProgress, saveProgress };

    function setMode(mode) {
        accountMode = mode;
        const signingUp = mode === "signup";
        title.textContent = signingUp ? "Create your account" : "Welcome back";
        description.textContent = signingUp
            ? "Sign up with your email and a username. We’ll send you a verification email."
            : "Sign in with the email and password for your Cube Club account.";
        usernameField.hidden = !signingUp;
        usernameInput.required = signingUp;
        passwordInput.autocomplete = signingUp ? "new-password" : "current-password";
        passwordHint.hidden = !signingUp;
        submitButton.textContent = signingUp ? "Create account" : "Sign in";
        showMessage(message, "", "");
        modeButtons.forEach(button => {
            const isActive = button.dataset.accountMode === mode;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    }

    function showUnavailable(text) {
        accountUnavailableMessage = text;
        setupMessage.textContent = text;
        setupMessage.hidden = false;
        formPanel.hidden = true;
        sessionPanel.hidden = true;
        openButton.textContent = "Create account";
    }

    function renderSession(session) {
        const requestId = ++profileRequestId;
        currentSession = session;
        sessionInitialized = true;
        sessionListeners.forEach(listener => window.setTimeout(() => listener(session), 0));
        const user = session && session.user;
        if (!user) {
            setMode(accountMode);
            sessionPanel.hidden = true;
            if (supabaseClient) {
                setupMessage.hidden = true;
                formPanel.hidden = false;
            } else {
                setupMessage.textContent = accountUnavailableMessage;
                setupMessage.hidden = false;
                formPanel.hidden = true;
            }
            openButton.textContent = "Create account";
            return;
        }

        title.textContent = "Your account";
        description.textContent = "Your learning progress and custom algorithms sync to this account.";
        sessionSummary.textContent = `Signed in as ${user.email}. Loading username…`;
        showMessage(sessionMessage, "", "");
        setupMessage.hidden = true;
        formPanel.hidden = true;
        sessionPanel.hidden = false;
        openButton.textContent = "Your account";
        window.setTimeout(() => loadProfile(user.id, user.email, requestId), 0);
    }

    async function loadProfile(userId, email, requestId) {
        if (!supabaseClient || requestId !== profileRequestId) return;
        try {
            const { data, error } = await supabaseClient
                .from("cube_club_profiles")
                .select("username")
                .eq("id", userId)
                .maybeSingle();
            if (requestId !== profileRequestId) return;
            if (error) throw error;
            if (!data) throw new Error("Your username profile is missing. Check the Supabase setup instructions.");
            sessionSummary.textContent = `Signed in as ${data.username} (${email}).`;
            openButton.textContent = data.username;
        } catch (error) {
            if (requestId !== profileRequestId) return;
            showMessage(sessionMessage, error && error.message ? error.message : "Could not load your username profile.", "error");
        }
    }

    function getEmailRedirectUrl() {
        if (window.location.protocol !== "http:" && window.location.protocol !== "https:") return "";
        return `${window.location.origin}${window.location.pathname}`;
    }

    async function submitAccountForm(event) {
        event.preventDefault();
        if (!supabaseClient) return;
        if (!form.reportValidity()) return;

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const username = usernameInput.value.trim();
        if (accountMode === "signup" && !usernamePattern.test(username)) {
            showMessage(message, "Use 3–20 letters, numbers, or underscores for your username.", "error");
            usernameInput.focus();
            return;
        }

        submitButton.disabled = true;
        modeButtons.forEach(button => { button.disabled = true; });
        showMessage(message, accountMode === "signup" ? "Creating your account…" : "Signing you in…", "");
        try {
            let result;
            if (accountMode === "signup") {
                const options = { data: { cube_club_username: username } };
                const redirectUrl = getEmailRedirectUrl();
                if (redirectUrl) options.emailRedirectTo = redirectUrl;
                result = await supabaseClient.auth.signUp({ email, password, options });
            } else {
                result = await supabaseClient.auth.signInWithPassword({ email, password });
            }
            if (result.error) throw result.error;

            if (accountMode === "signup" && !result.data.session) {
                showMessage(
                    message,
                    "If this email is new, check your inbox for a verification link. If you already have an account, choose Sign in.",
                    "success"
                );
                return;
            }

            renderSession(result.data.session);
            dialog.close();
        } catch (error) {
            showMessage(message, error && error.message ? error.message : "The account request failed. Please try again.", "error");
        } finally {
            submitButton.disabled = false;
            modeButtons.forEach(button => { button.disabled = false; });
        }
    }

    async function restoreSession() {
        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            renderSession(data.session);
        } catch (error) {
            showMessage(message, error && error.message ? error.message : "Could not restore your sign-in session.", "error");
        }
    }

    async function signOut() {
        signOutButton.disabled = true;
        showMessage(sessionMessage, "Signing out…", "");
        try {
            const { error } = await supabaseClient.auth.signOut();
            if (error) throw error;
            renderSession(null);
            setMode("signup");
        } catch (error) {
            showMessage(sessionMessage, error && error.message ? error.message : "Could not sign out. Please try again.", "error");
        } finally {
            signOutButton.disabled = false;
        }
    }

    openButton.addEventListener("click", () => dialog.showModal());
    closeButton.addEventListener("click", () => dialog.close());
    modeButtons.forEach(button => button.addEventListener("click", () => setMode(button.dataset.accountMode)));
    form.addEventListener("submit", submitAccountForm);
    signOutButton.addEventListener("click", signOut);

    setMode("signup");
    const config = window.CUBE_CLUB_SUPABASE_CONFIG;
    if (!config || !config.url || !config.publishableKey) {
        showUnavailable("Account sign-up is not configured yet. Add your Supabase project URL and publishable key to supabase-config.js.");
        return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        showUnavailable("The Supabase client could not load. Check your internet connection and reload the page.");
        return;
    }

    try {
        supabaseClient = window.supabase.createClient(config.url, config.publishableKey);
    } catch (error) {
        showUnavailable(error && error.message ? `Could not connect to Supabase: ${error.message}` : "Could not initialize Supabase.");
        return;
    }

    setupMessage.hidden = true;
    formPanel.hidden = false;
    supabaseClient.auth.onAuthStateChange((_event, session) => renderSession(session));
    restoreSession();
})();
