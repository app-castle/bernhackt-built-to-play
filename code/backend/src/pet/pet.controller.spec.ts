import { UnauthorizedException } from '@nestjs/common';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';

describe('PetController', () => {
  let petService: Partial<jest.Mocked<PetService>>;
  let controller: PetController;

  beforeEach(() => {
    petService = {
      create: jest.fn(),
      train: jest.fn(),
      getCurrent: jest.fn(),
      getStatus: jest.fn(),
      listOthers: jest.fn(),
    };

    controller = new PetController(petService as unknown as PetService);
  });

  it('delegates listOthers with the extracted token', async () => {
    await controller.listOthers('Bearer abc123');
    expect(petService.listOthers).toHaveBeenCalledWith('abc123');
  });

  it('throws UnauthorizedException from listOthers when the authorization header is missing', () => {
    expect(() => controller.listOthers(undefined)).toThrow(
      UnauthorizedException,
    );
  });

  it('delegates getStatus with the extracted token', async () => {
    await controller.getStatus('Bearer abc123');
    expect(petService.getStatus).toHaveBeenCalledWith('abc123');
  });

  it('throws UnauthorizedException when the authorization header has no Bearer prefix', () => {
    expect(() => controller.getStatus('abc123')).toThrow(UnauthorizedException);
  });
});
