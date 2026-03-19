import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      test: 'todo'
    },

    backgrounds: { disable: true },
  },

  decorators: [
    (Story) => (
      <div className="dark font-sans">
        <Story />
      </div>
    ),
  ],
};

export default preview;