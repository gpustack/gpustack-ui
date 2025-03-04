# Adding a New Language Configuration

To add a new language configuration, follow these steps:

## 1. **Duplicate an Existing Language Directory**

- Choose any existing language directory that you are familiar with, and duplicate it.
- Name the new directory according to the `lang` attribute specified in `lang-config-map.tsx`.

## 2. **Create a New `.ts` File in the Current Directory**

- In the `locales` directory, create a `.ts` file named to align with the new directory.
- Copy the contents of the `en-US.ts` file into this new `.ts` file.
- Update the following line to match your new language directory:
  ```ts
  const requireContext = require.context(
    `./{new-language-directory}`,
    false,
    /\.ts$/
  );
  ```

## 3. **Translate Each Attribute Value**

- Open the `.ts` file in the **new directory**.
- For each key-value pair:
  - If a translation is available, replace the value with the translated text.
  - If no translation is available yet, **replace the value with** `"TODO: Translate me"`.

**Example:**

```ts
export default {
  welcome_message: 'TODO: Translate me',
  logout_button: 'TODO: Translate me'
};
```

## 4. **Finalize the Configuration**

- Review and ensure all translations are complete.
- If any translations are missing, contributors can later replace `"TODO: Translate me"` with the correct translation.
- Your new language configuration is now ready for use!
