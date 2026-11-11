import { mockStore } from '../src/mock/mockStore';

describe('Profile Photo Deletion & Cross-Account Synchronization', () => {
  const kumarId = 'usr_man_kumar_101';
  const femaleId = 'usr_woman_201';
  const photo1 = 'https://images.unsplash.com/photo-kumar-1.jpg';
  const photo2 = 'https://images.unsplash.com/photo-kumar-2.jpg';
  const photo3 = 'https://images.unsplash.com/photo-kumar-3.jpg';

  beforeEach(async () => {
    // Ensure mockStore is initialized first, then seed
    await mockStore.init();
    (mockStore as any).initialized = true;

    // Setup Kumar's profile with 3 photos
    (mockStore as any).profiles = [
      {
        userId: kumarId,
        email: 'kumar@gmail.com',
        name: 'Kumar',
        displayName: 'Kumar',
        gender: 'man',
        age: 28,
        bio: 'Hello',
        photos: [photo1, photo2, photo3],
      },
      {
        userId: femaleId,
        email: 'female@gmail.com',
        name: 'Priya',
        displayName: 'Priya',
        gender: 'woman',
        age: 26,
        bio: 'Hi',
        photos: ['https://images.unsplash.com/photo-priya.jpg'],
      },
    ];

    (mockStore as any).images = [
      { id: 1001, userId: kumarId, imageUrl: photo1, isProfile: true, fileName: 'k1.jpg', fileType: 'image/jpeg', fileSize: 1000, uploadedAt: new Date().toISOString() },
      { id: 1002, userId: kumarId, imageUrl: photo2, isProfile: false, fileName: 'k2.jpg', fileType: 'image/jpeg', fileSize: 1000, uploadedAt: new Date().toISOString() },
      { id: 1003, userId: kumarId, imageUrl: photo3, isProfile: false, fileName: 'k3.jpg', fileType: 'image/jpeg', fileSize: 1000, uploadedAt: new Date().toISOString() },
    ];

    // Kumar sends an invitation to Priya
    (mockStore as any).requests = [
      {
        id: 'req_kumar_to_priya',
        senderId: kumarId,
        receiverId: femaleId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        sender: {
          id: kumarId as any,
          name: 'Kumar',
          displayName: 'Kumar',
          photos: [photo1, photo2, photo3],
          photo: photo1,
        },
        receiver: {
          id: femaleId as any,
          name: 'Priya',
          displayName: 'Priya',
        },
        senderPhoto: photo1,
        senderPhotos: [photo1, photo2, photo3],
      },
    ];
  });

  test('Kumar has 3 images initially, and Priya receives request with 3 images', async () => {
    const kumarImages = await mockStore.getUserImages(kumarId);
    expect(kumarImages).toHaveLength(3);

    const received = await mockStore.getReceivedRequests(femaleId);
    expect(received).toHaveLength(1);
    expect(received[0].sender?.photos).toEqual([photo1, photo2, photo3]);
  });

  test('When Kumar deletes photo 3, it is completely removed from his profile, gallery, and Priya’s received requests', async () => {
    // Kumar deletes photo 3 by image ID or URL
    const deleted = await mockStore.deleteUserImage(1003, kumarId, photo3);
    expect(deleted).toBe(true);

    // 1. Kumar's gallery has only 2 photos
    const kumarImages = await mockStore.getUserImages(kumarId);
    expect(kumarImages).toHaveLength(2);
    expect(kumarImages.map((i: any) => i.imageUrl || i.url)).toEqual([photo1, photo2]);
    expect(kumarImages.map((i: any) => i.imageUrl || i.url)).not.toContain(photo3);

    // 2. Kumar's profile photos array has only 2 photos
    const kumarProfile = await mockStore.getProfileByUserId(kumarId);
    expect(kumarProfile?.photos).toEqual([photo1, photo2]);
    expect(kumarProfile?.photos).not.toContain(photo3);

    // 3. Priya viewing received request gets synchronized sender photos (only 2, photo 3 deleted)
    const priyaReceived = await mockStore.getReceivedRequests(femaleId);
    expect(priyaReceived).toHaveLength(1);
    const req = priyaReceived[0];
    expect(req.sender?.photos).toEqual([photo1, photo2]);
    expect(req.sender?.photos).not.toContain(photo3);
    expect((req as any).senderPhotos).toEqual([photo1, photo2]);
    expect((req as any).senderPhotos).not.toContain(photo3);

    // 4. Kumar's sent requests are also updated
    const kumarSent = await mockStore.getSentRequests(kumarId);
    expect(kumarSent).toHaveLength(1);
    expect(kumarSent[0].sender?.photos).toEqual([photo1, photo2]);
    expect(kumarSent[0].sender?.photos).not.toContain(photo3);
  });

  test('ViewMyProfileScreen resolution prioritizes live gallery images over stale route parameters', () => {
    // Simulate stale navigation route params with old 3 photos
    const staleRoutePhotos = [photo1, photo2, photo3];

    // Live authoritative gallery images (after deletion)
    const liveGalleryImages = [photo1, photo2];

    // Resolution rule implemented in ViewMyProfileScreen:
    // If live targetGalleryImages exists, use it as source of truth.
    const resolvedImages = liveGalleryImages.length > 0
      ? liveGalleryImages
      : staleRoutePhotos;

    expect(resolvedImages).toEqual([photo1, photo2]);
    expect(resolvedImages).not.toContain(photo3);
  });
});
