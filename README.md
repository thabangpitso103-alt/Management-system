# Student Management System (DIWA2110)

An interactive student dashboard built with **React** and **JavaScript**. Users can view, search, add, edit and delete student records. Add/edit and delete-confirmation both use modal dialogs, and the table updates immediately without a page refresh.

Each record has: student ID, full name, age, email, course of study, and enrollment status.

## Run locally

```
node server.js
```

Open http://localhost:3000. Needs Node.js 16+ and an internet connection (React loads from a CDN). There is nothing to install.
Records are saved to `data/students.json`.

## Deploy (Netlify or Vercel)

Static hosting can't run `server.js`, so the site is the `public` folder (already set in `netlify.toml` and `vercel.json`). No build command is needed.
With no server available, the app saves records in the browser's **localStorage**, so everything still works after deployment.

## Project structure

```
server.js              Node server: serves /public and a JSON API
package.json           Project info and the "start" script (no dependencies)
netlify.toml, vercel.json   Deploy settings (publish the public folder)
data/students.json     Created automatically when you run server.js
public/
  index.html           Page shell, loads React from a CDN
  styles.css           Responsive styling
  js/
    utils.js           Data shapes, validation, search and stats helpers
    storage.js         Load/save/delete (server API, or localStorage fallback)
    App.jsx            Parent component: owns all state
    StudentTable.jsx   Table, rows and status badge
    Modal.jsx          Reusable modal shell (Escape + backdrop to close)
    StudentModal.jsx   Add/edit form with validation
    ConfirmModal.jsx   Delete confirmation
```

## Data types and why

| Data | Type | Why |
|---|---|---|
| `studentId` | string | An identifier, not something to calculate with. Keeps leading zeros. |
| `name`, `email`, `course` | string | Text. |
| `age` | number | Can be compared (16 to 100) and averaged. Form inputs return text, so `normaliseStudent()` converts it with `Number()`. |
| `enrolled` | boolean | Only two states: enrolled or not. |
| a student | object | Groups the fields of one record. |
| all students | array | An ordered list that supports `map`, `filter`, `reduce`, `some`, `findIndex`. |

## Variable declarations and why

- `const` for anything never reassigned: `COURSES`, `EMPTY_STUDENT`, every function and component. (A `const` array or object can still have its contents changed, but the variable can't point at something else.)
- `let` for values that must be reassigned: `usingServer` in `storage.js` (switches between server and localStorage mode).
- `var` in `nextId()` in `utils.js`, on purpose, to show it is function-scoped: `highest` is still visible after the `for` loop, where a `let` would not be. Everywhere else `let`/`const` are preferred because block scope is safer.

## Functions and array methods

- `validateStudent`, `normaliseStudent`, `filterStudents`, `getStats` are reusable, take parameters and return values.
- `filter` (search, delete), `map` (render rows, edit), `some` (duplicate ID, search), `reduce` (average age), `findIndex` (update).
- Conditionals are used in validation, empty states and the add-vs-edit logic.

## Validation rules

- Student ID: required and must be unique.
- Full name: required.
- Age: required, whole number from 16 to 100.
- Email: must look like `name@example.com`.
- Course: required (dropdown).
Errors show under each field and an invalid form is never saved.

## Testing checklist

Tested in the app (add, edit, delete, cancel, validation, empty state, search):

| Test | Result |
|---|---|
| Seed students load; stats show 3 students, 2 enrolled | Pass |
| Add: empty form shows errors and does not save | Pass |
| Add: duplicate ID, age 5 and bad email each show a message | Pass |
| Add: valid student appears immediately; name trimmed; age saved as a number | Pass |
| Cancel button closes modal and changes nothing | Pass |
| Escape key closes modal | Pass |
| Edit: form is pre-filled; saving updates the row immediately | Pass |
| Edit: enrollment status can be changed | Pass |
| Search filters rows; no match shows a message | Pass |
| Delete: confirm modal opens; "Keep student" cancels | Pass |
| Delete: confirming removes the row immediately | Pass |
| Deleting everyone shows the empty-state message | Pass |
| API: create, update, delete, duplicate ID and invalid data rejected | Pass |

Before you submit, repeat these once by hand on your live Netlify/Vercel URL.
