# Adding a New Language Configuration

To add a new language configuration, follow these steps:

1. **Duplicate an Existing Language Directory**

   - Choose any existing language directory that you are familiar with, and duplicate it.
   - Name the new directory according to the `lang` attribute specified in `lang-config-map.tsx`.

2. **Create a New `.ts` File in the Current Directory**

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

3. **Translate Each Attribute Value**

   - Open the `.ts` file in the **new directory**.
   - Translate the value of each key into your target language.

4. **Finalize the Configuration**

   - Review and ensure all translations are complete.
   - Your new language configuration is now ready for use!
