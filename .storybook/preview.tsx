import React from 'react';
import type { Preview } from '@storybook/react';
import '../src/App.module.scss';
import '../src/index.css';
import './preview.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <div className='storybook-decorator' style={{ width: '100%' }}>
        <Story />
      </div>
    ),
  ]
};

export default preview;
