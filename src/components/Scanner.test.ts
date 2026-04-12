import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock barcode validation regex from Scanner.tsx
const EAN_REGEX = /^\d{8,13}$/;

// Mock camera device data
const mockBackCamera = {
  deviceId: "back-camera-id",
  label: "Back Camera",
  kind: "videoinput",
  groupId: "group1",
  toJSON: () => ({}),
} as MediaDeviceInfo;

const mockFrontCamera = {
  deviceId: "front-camera-id",
  label: "Front Camera (Selfie)",
  kind: "videoinput",
  groupId: "group2",
  toJSON: () => ({}),
} as MediaDeviceInfo;

const mockEnvironmentCamera = {
  deviceId: "environment-camera-id",
  label: "Environment Facing",
  kind: "videoinput",
  groupId: "group3",
  toJSON: () => ({}),
} as MediaDeviceInfo;

const mockUserCamera = {
  deviceId: "user-camera-id",
  label: "User Camera",
  kind: "videoinput",
  groupId: "group4",
  toJSON: () => ({}),
} as MediaDeviceInfo;

const mockRearCamera = {
  deviceId: "rear-camera-id",
  label: "Rear Ultra Wide",
  kind: "videoinput",
  groupId: "group5",
  toJSON: () => ({}),
} as MediaDeviceInfo;

describe("Scanner component logic", () => {
  describe("EAN/UPC barcode validation", () => {
    it("accepts valid 8-digit EAN-8 barcodes", () => {
      expect(EAN_REGEX.test("12345678")).toBe(true);
      expect(EAN_REGEX.test("76222104")).toBe(true);
    });

    it("accepts valid 12-digit UPC-A barcodes", () => {
      expect(EAN_REGEX.test("012345678901")).toBe(true);
      expect(EAN_REGEX.test("762221044928")).toBe(true);
    });

    it("accepts valid 13-digit EAN-13 barcodes", () => {
      expect(EAN_REGEX.test("5000159484695")).toBe(true);
      expect(EAN_REGEX.test("3017620422003")).toBe(true);
    });

    it("rejects barcodes with less than 8 digits", () => {
      expect(EAN_REGEX.test("123")).toBe(false);
      expect(EAN_REGEX.test("1234567")).toBe(false);
    });

    it("rejects barcodes with more than 13 digits", () => {
      expect(EAN_REGEX.test("12345678901234")).toBe(false);
      expect(EAN_REGEX.test("123456789012345")).toBe(false);
    });

    it("rejects barcodes with non-digit characters", () => {
      expect(EAN_REGEX.test("1234567a")).toBe(false);
      expect(EAN_REGEX.test("abcdefghijklm")).toBe(false);
      expect(EAN_REGEX.test("500-015948469")).toBe(false);
    });

    it("rejects empty barcodes", () => {
      expect(EAN_REGEX.test("")).toBe(false);
    });
  });

  describe("camera selection logic", () => {
    function selectCamera(
      devices: MediaDeviceInfo[],
      cameraFacing: "environment" | "user"
    ): string | undefined {
      if (cameraFacing === "environment") {
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
        );
        return backCamera?.deviceId ?? devices[0]?.deviceId;
      } else {
        const frontCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("front") ||
            d.label.toLowerCase().includes("user") ||
            d.label.toLowerCase().includes("selfie")
        );
        return frontCamera?.deviceId ?? devices[0]?.deviceId;
      }
    }

    describe("environment (back) camera selection", () => {
      it("selects camera with 'back' in label", () => {
        const devices = [mockFrontCamera, mockBackCamera];
        expect(selectCamera(devices, "environment")).toBe("back-camera-id");
      });

      it("selects camera with 'rear' in label", () => {
        const devices = [mockFrontCamera, mockRearCamera];
        expect(selectCamera(devices, "environment")).toBe("rear-camera-id");
      });

      it("selects camera with 'environment' in label", () => {
        const devices = [mockUserCamera, mockEnvironmentCamera];
        expect(selectCamera(devices, "environment")).toBe(
          "environment-camera-id"
        );
      });

      it("falls back to first available camera if no match found", () => {
        const devices = [mockFrontCamera, mockUserCamera];
        expect(selectCamera(devices, "environment")).toBe("front-camera-id");
      });

      it("returns undefined when no devices available", () => {
        expect(selectCamera([], "environment")).toBeUndefined();
      });

      it("selects first matching camera from array order", () => {
        // find() returns first match - order matters, not keyword priority
        const devices = [mockRearCamera, mockEnvironmentCamera, mockBackCamera];
        expect(selectCamera(devices, "environment")).toBe("rear-camera-id");
      });
    });

    describe("user (front) camera selection", () => {
      it("selects camera with 'front' in label", () => {
        const devices = [mockBackCamera, mockFrontCamera];
        expect(selectCamera(devices, "user")).toBe("front-camera-id");
      });

      it("selects camera with 'user' in label", () => {
        const devices = [mockBackCamera, mockUserCamera];
        expect(selectCamera(devices, "user")).toBe("user-camera-id");
      });

      it("selects camera with 'selfie' in label", () => {
        const selfieCamera = {
          ...mockFrontCamera,
          deviceId: "selfie-id",
          label: "Selfie Camera",
        };
        const devices = [mockBackCamera, selfieCamera];
        expect(selectCamera(devices, "user")).toBe("selfie-id");
      });

      it("falls back to first available camera if no match found", () => {
        const devices = [mockBackCamera, mockRearCamera];
        expect(selectCamera(devices, "user")).toBe("back-camera-id");
      });

      it("returns undefined when no devices available", () => {
        expect(selectCamera([], "user")).toBeUndefined();
      });
    });
  });

  describe("barcode debouncing", () => {
    let lastDetectedRef: string | null = null;
    let lastDetectedTimeRef: number = 0;

    beforeEach(() => {
      lastDetectedRef = null;
      lastDetectedTimeRef = 0;
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function shouldProcessBarcode(
      code: string,
      now: number,
      debounceMs: number = 3000
    ): boolean {
      if (code === lastDetectedRef && now - lastDetectedTimeRef < debounceMs) {
        return false;
      }
      lastDetectedRef = code;
      lastDetectedTimeRef = now;
      return true;
    }

    it("processes first barcode immediately", () => {
      const now = Date.now();
      expect(shouldProcessBarcode("7622210449283", now)).toBe(true);
    });

    it("ignores same barcode within 3 second window", () => {
      const now = Date.now();
      expect(shouldProcessBarcode("7622210449283", now)).toBe(true);
      expect(shouldProcessBarcode("7622210449283", now + 1000)).toBe(false);
      expect(shouldProcessBarcode("7622210449283", now + 2500)).toBe(false);
    });

    it("processes same barcode after 3 second window", () => {
      const now = Date.now();
      expect(shouldProcessBarcode("7622210449283", now)).toBe(true);
      expect(shouldProcessBarcode("7622210449283", now + 3001)).toBe(true);
    });

    it("processes different barcode immediately regardless of timing", () => {
      const now = Date.now();
      expect(shouldProcessBarcode("7622210449283", now)).toBe(true);
      expect(shouldProcessBarcode("5000159484695", now + 500)).toBe(true);
      expect(shouldProcessBarcode("3017620422003", now + 1000)).toBe(true);
    });

    it("alternating between two barcodes processes both", () => {
      const now = Date.now();
      expect(shouldProcessBarcode("1111111111111", now)).toBe(true);
      expect(shouldProcessBarcode("2222222222222", now + 100)).toBe(true);
      expect(shouldProcessBarcode("1111111111111", now + 200)).toBe(true);
      expect(shouldProcessBarcode("2222222222222", now + 300)).toBe(true);
    });

    it("respects custom debounce duration", () => {
      const now = Date.now();
      expect(shouldProcessBarcode("7622210449283", now, 1000)).toBe(true);
      expect(shouldProcessBarcode("7622210449283", now + 500, 1000)).toBe(false);
      expect(shouldProcessBarcode("7622210449283", now + 1001, 1000)).toBe(true);
    });
  });
});
