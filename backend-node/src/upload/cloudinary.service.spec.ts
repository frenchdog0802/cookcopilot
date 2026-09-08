import { NotFoundError } from '../common/errors/http-errors';
import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService ownership', () => {
  const service = Object.create(
    CloudinaryService.prototype,
  ) as CloudinaryService;

  it('accepts public ids under the user folder', () => {
    expect(() =>
      service.assertOwnedPublicId('u1', 'users/u1/photo123'),
    ).not.toThrow();
  });

  it('rejects other users public ids', () => {
    expect(() =>
      service.assertOwnedPublicId('u1', 'users/u2/photo123'),
    ).toThrow(NotFoundError);
  });

  it('rejects legacy shared folder deletes', () => {
    expect(() =>
      service.assertOwnedPublicId('u1', 'my_uploads/photo123'),
    ).toThrow(NotFoundError);
  });
});
