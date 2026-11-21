/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  let renderer: any;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<App />);
  });
  expect(renderer).toBeDefined();

  // Clean unmount to teardown navigation container and active screen effects
  await ReactTestRenderer.act(async () => {
    if (renderer && typeof renderer.unmount === 'function') {
      renderer.unmount();
    }
  });
});
