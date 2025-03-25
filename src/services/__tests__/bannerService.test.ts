import { BannerService, Banner } from '../bannerService';

describe('BannerService', () => {
    let bannerService: BannerService;
    let mockBlob: Blob;

    beforeEach(() => {
        bannerService = new BannerService();
        mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    });

    describe('addBanner', () => {
        it('should add a new banner', () => {
            const banner: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title',
                releaseDay: 'Monday',
                releaseTime: '12:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            const result = bannerService.addBanner(banner);
            expect(result).toMatchObject(banner);
            const allBanners = bannerService.getAllBanners();
            expect(allBanners).toHaveLength(1);
            expect(allBanners[0]).toMatchObject(banner);
        });

        it('should not add banner if title exists', () => {
            const banner: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title',
                releaseDay: 'Monday',
                releaseTime: '12:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            bannerService.addBanner(banner);
            expect(() => bannerService.addBanner(banner)).toThrow('A banner with this title already exists');
            expect(bannerService.getAllBanners()).toHaveLength(1);
        });
    });

    describe('deleteBanner', () => {
        it('should delete banner by title', () => {
            const banner: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title',
                releaseDay: 'Monday',
                releaseTime: '12:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            bannerService.addBanner(banner);
            const result = bannerService.deleteBanner('Test Title');

            expect(result).toHaveLength(0);
        });

        it('should not delete anything if title does not exist', () => {
            const banner: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title',
                releaseDay: 'Monday',
                releaseTime: '12:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            bannerService.addBanner(banner);
            const result = bannerService.deleteBanner('Non-existent Title');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject(banner);
        });
    });

    describe('searchBanners', () => {
        it('should return matching banners', () => {
            const banner1: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title 1',
                releaseDay: 'Monday',
                releaseTime: '12:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            const banner2: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title 2',
                releaseDay: 'Tuesday',
                releaseTime: '13:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            bannerService.addBanner(banner1);
            bannerService.addBanner(banner2);

            const result = bannerService.searchBanners('Title 1');
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject(banner1);
        });

        it('should be case insensitive', () => {
            const banner: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title',
                releaseDay: 'Monday',
                releaseTime: '12:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            bannerService.addBanner(banner);
            const result = bannerService.searchBanners('test title');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject(banner);
        });
    });

    describe('getAllBanners', () => {
        it('should return all banners', () => {
            const banner1: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title 1',
                releaseDay: 'Monday',
                releaseTime: '12:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            const banner2: Omit<Banner, 'id'> = {
                imageFile: mockBlob,
                title: 'Test Title 2',
                releaseDay: 'Tuesday',
                releaseTime: '13:00',
                currentEpisodes: 0,
                totalEpisodes: 12
            };

            bannerService.addBanner(banner1);
            bannerService.addBanner(banner2);

            const result = bannerService.getAllBanners();
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject(banner1);
            expect(result[1]).toMatchObject(banner2);
        });
    });
}); 