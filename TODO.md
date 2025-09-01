# TODO: Voice Assistant Improvements

## Information Gathered
- VoiceAssistant.jsx: Handles speech recognition, command execution, and speech synthesis. Uses user.assistantName to detect commands. Speaks responses but does not introduce itself or handle voice gender.
- User model: Has name (user's name), assistantName (assistant's name), imagePath (assistant's image).
- SetupProfile.jsx: Sets assistantName and image for the assistant.
- aiController.js: Has interpretCommand using OpenAI for parsing commands into actions, defaults to search for unknown.
- Routes: /api/ai/interpret exists for command interpretation.

## Plan
1. **Update VoiceAssistant.jsx**:
   - Add introduction logic: When starting or on first command, introduce as "Hello, I am [assistantName]. How can I help you [user.name]?"
   - Add voice gender detection: Check if assistantName is female (simple list: e.g., ends with 'a', 'i', or common female names), set speechSynthesis voice to female if available.
   - For common questions: If no command executed, call backend AI for general response instead of default search.
   - Modify speak function to use selected voice.

2. **Update backend/controllers/aiController.js**:
   - Add new function `generalChat` for OpenAI chat completions for non-command queries.
   - Use GPT-4o-mini for responses to common questions.

3. **Update backend/routes/ai.js**:
   - Add new route POST /api/ai/chat for general chat.

4. **Test and verify**:
   - Ensure OpenAI API key is set in .env.
   - Test introduction, voice gender, and common question responses.

## Dependent Files to be Edited
- frontend/src/components/VoiceAssistant.jsx
- backend/controllers/aiController.js
- backend/routes/ai.js

## Followup Steps
- Set up OpenAI API key in backend/.env if not present.
- Test voice assistant functionality after changes.
- Handle cases where no voice is available for gender.
