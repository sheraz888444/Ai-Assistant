# File Upload Fix - Task Tracking

## Steps to Complete:

1. [ ] Update CustomizePage.jsx to include assistant name input field
2. [ ] Modify handleSubmit to send both image and name in FormData
3. [ ] Update navigation to go directly to dashboard after successful upload
4. [ ] Remove or modify CustomizeName.jsx (optional - may keep for other purposes)
5. [ ] Test the complete upload functionality

## Current Issue:
- File upload workflow is split between two pages
- CustomizePage uploads image but doesn't send name
- CustomizeName sends name but doesn't have the uploaded file
- Results in second request showing undefined file

## Solution:
- Combine both functionalities in CustomizePage
- Send both image and name in a single request
- Update user setup status when both are provided
