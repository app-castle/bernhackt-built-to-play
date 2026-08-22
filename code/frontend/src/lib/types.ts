export interface PetSittingStatus {
  state: "available" | "raiding" | "pet_sitting" | "tired";
  availableAt: Date | null;
}
