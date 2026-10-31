import React from 'react';
import { Image, View } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';
import OsmMapView from '../src/components/SearchSettingsComponents/OsmMapView';

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

const region = {
  latitude: 17.385,
  longitude: 78.4867,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

describe('OsmMapView', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders keyless OpenStreetMap tiles and the selected place name', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <OsmMapView region={region} markerTitle="Hyderabad" />,
      );
    });

    const mapContainer = renderer!.root
      .findAllByType(View)
      .find((node) => typeof node.props.onLayout === 'function');

    expect(mapContainer).toBeTruthy();

    await act(async () => {
      mapContainer!.props.onLayout({
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 600 } },
      });
    });

    const tiles = renderer!.root.findAllByType(Image);
    expect(tiles.length).toBeGreaterThan(0);
    expect(tiles[0].props.source.uri).toMatch(
      /^https:\/\/tile\.openstreetmap\.org\/14\/\d+\/\d+\.png$/,
    );

    const rendered = JSON.stringify(renderer!.toJSON());
    expect(rendered).toContain('Hyderabad');
    expect(rendered).toContain('OpenStreetMap');

    await act(async () => {
      jest.advanceTimersByTime(1600);
      renderer!.unmount();
    });
  });
});
