<!-- Project architecture rules -->
- Keep phone lesson-goal verification in a shared deterministic module and reject incomplete or ungrounded goals before display, because truncation breaks the lesson promise.
- Keep phone source and its parallel JavaScript entry in sync, because the mobile app contains both forms.
- Unlock phone practice from credited studied stacks, falling back from a requested Course day to actual completed lessons, because catch-up progress need not match the displayed day.
- Load optional native notification bridges after the first screen mounts and contain failures, because notification setup must never block iOS launch.
- Keep the website's compact phone landing separate from the larger-screen presentation while sharing the real demo and download actions, because small screens need editorial hierarchy without duplicating behavior.
- Keep the website demo aligned with the phone’s universal three-concept AI lesson while showing preview-only rewards, because web visitors must not mistake a preview for credited app progress.
