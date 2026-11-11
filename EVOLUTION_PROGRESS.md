# Tengu Evolution — implementation tracker

## Current milestone: 8.3 Evolution Bundled Alpha
- [x] GitHub Actions workflow downloads and SHA256-checks a 491,400,032-byte Qwen2.5 0.5B GGUF at build time.
- [x] The Android APK build includes the GGUF in its assets.
- [x] First launch copies the model to app-private storage, checks its hash, and enables offline inference.
- [x] Existing Tengu 8.2 remains a separate installation.
- [ ] Successful APK compilation and installation must be verified.
- [ ] Test offline generation on a physical Android device.

## Next milestones (NOT YET IMPLEMENTED)
1. **Tengu-4**: choose and benchmark a stronger open-weight model. A larger GGUF will need more RAM and storage; do not imply it is newly trained.
2. **Tengu Agent**: sandboxed workspace, file editing, coding tests, explicit approval before destructive actions, local coder model.
3. **Tengu Connect**: Telegram Bot API and developer API; disclose when messages are transmitted to Telegram or connected services.
4. **Tengu Image Studio**: on-device image enhancement first, then realistic image generation with model/hardware requirements clearly stated.
5. **Search**: retrieval from supported public sources, citations, consent for external queries.
6. **Privacy**: local chat storage and model inference by default, no hidden remote text-LLM fallback, explicit opt-in for external tools.
7. **Branding**: new original Tengu icon, moderate UI refresh, new key mechanism.
8. **Speed and QA**: model startup timing, RAM measurement, regression tests, device benchmarks.

## Notes
Bundled model is an open-weight third-party model run locally by Tengu. This is a hybrid *application architecture*, not a model trained from scratch.
