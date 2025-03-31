import { BannerService, Banner } from '../bannerService';

describe('BannerService', () => {
    let bannerService: BannerService;
    let mock_binary: number[];

    beforeEach(() => {
        bannerService = new BannerService();
        mock_binary = Array.from(new Uint8Array());
    });

    describe('addBanner', () => {
        it('should add a new banner', () => {
            const banner: Omit<Banner, 'id'> = {
                image_binary: mock_binary,
                title: 'Test Title',
                release_day: 'Monday',
                release_time: '12:00',
                current_episodes: 0,
                total_episodes: 12
            };

            const result = bannerService.addBanner(banner);
            expect(result).toMatchObject(banner);
            const allBanners = bannerService.getAllBanners();
            expect(allBanners).toHaveLength(1);
            expect(allBanners[0]).toMatchObject(banner);
        });

        it('should not add banner if title exists', () => {
            const banner: Omit<Banner, 'id'> = {
                image_binary: mock_binary,
                title: 'Test Title',
                release_day: 'Monday',
                release_time: '12:00',
                current_episodes: 0,
                total_episodes: 12
            };

            bannerService.addBanner(banner);
            expect(() => bannerService.addBanner(banner)).toThrow('A banner with this title already exists');
            expect(bannerService.getAllBanners()).toHaveLength(1);
        });
    });

    describe('deleteBanner', () => {
        it('should delete banner by id', () => {
            const banner: Banner = {
                id: 'test-id',
                image_binary: mock_binary,
                title: 'Test Title',
                release_day: 'Monday',
                release_time: '12:00',
                current_episodes: 0,
                total_episodes: 12
            };

            bannerService.addBanner(banner);
            const result = bannerService.deleteBanner('Test Title');

            expect(result).toHaveLength(0);
        });

        it('should not delete anything if id does not exist', () => {
            const banner: Banner = {
                id: 'test-id',
                image_binary: mock_binary,
                title: 'Test Title',
                release_day: 'Monday',
                release_time: '12:00',
                current_episodes: 0,
                total_episodes: 12
            };

            bannerService.addBanner(banner);
            const result = bannerService.deleteBanner('Non-existent id');

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject(banner);
        });
    });

    describe('searchBanners', () => {
        it('should return matching banners', () => {
            const banner1: Omit<Banner, 'id'> = {
                image_binary: mock_binary,
                title: 'Test Title 1',
                release_day: 'Monday',
                release_time: '12:00',
                current_episodes: 0,
                total_episodes: 12
            };

            const banner2: Omit<Banner, 'id'> = {
                image_binary: mock_binary,
                title: 'Test Title 2',
                release_day: 'Tuesday',
                release_time: '13:00',
                current_episodes: 0,
                total_episodes: 12
            };

            bannerService.addBanner(banner1);
            bannerService.addBanner(banner2);

            const result = bannerService.searchBanners('Title 1');
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject(banner1);
        });

        it('should be case insensitive', () => {
            const banner: Omit<Banner, 'id'> = {
                image_binary: mock_binary,
                title: 'Test Title',
                release_day: 'Monday',
                release_time: '12:00',
                current_episodes: 0,
                total_episodes: 12
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
                image_binary: mock_binary,
                title: 'Test Title 1',
                release_day: 'Monday',
                release_time: '12:00',
                current_episodes: 0,
                total_episodes: 12
            };

            const banner2: Omit<Banner, 'id'> = {
                image_binary: mock_binary,
                title: 'Test Title 2',
                release_day: 'Tuesday',
                release_time: '13:00',
                current_episodes: 0,
                total_episodes: 12
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