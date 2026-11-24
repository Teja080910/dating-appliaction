import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import YourBirthday from '../src/components/ProfileTabComponents/ProfileSettings/YourBirthday';

jest.mock('react-native-date-picker', () => 'DatePicker');

const pad = (value: number) => String(value).padStart(2, '0');
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const renderTexts = async (value: string) => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;
  await act(async () => {
    renderer = ReactTestRenderer.create(
      <YourBirthday value={value} onChange={jest.fn()} />
    );
  });

  const texts = renderer!.root
    .findAllByType(Text)
    .map((node: any) => node.props.children)
    .filter((child: any) => typeof child === 'string' || typeof child === 'number');

  return {
    texts: texts.map(String),
    json: JSON.stringify(renderer!.toJSON()),
    unmount: async () => {
      await act(async () => {
        renderer?.unmount();
      });
    },
  };
};

describe('YourBirthday range display', () => {
  it('shows the clamped 18+ date (not the underage stored date) and warns', async () => {
    const max = new Date();
    max.setFullYear(max.getFullYear() - 18);

    const underage = new Date();
    underage.setFullYear(underage.getFullYear() - 10);

    const view = await renderTexts(toYmd(underage));

    expect(view.texts).toEqual(
      expect.arrayContaining([
        String(max.getDate()),
        String(max.getMonth() + 1),
        String(max.getFullYear()),
      ])
    );
    expect(view.texts).not.toContain(String(underage.getFullYear()));
    expect(view.json).toContain('at least 18 years old');

    await view.unmount();
  });

  it('shows the exact stored date when it is within range', async () => {
    const valid = new Date();
    valid.setFullYear(valid.getFullYear() - 30);

    const view = await renderTexts(toYmd(valid));

    expect(view.texts).toEqual(
      expect.arrayContaining([
        String(valid.getDate()),
        String(valid.getMonth() + 1),
        String(valid.getFullYear()),
      ])
    );
    expect(view.json).not.toContain('at least 18 years old');

    await view.unmount();
  });
});
