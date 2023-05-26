// https://en.wikipedia.org/wiki/Visible_spectrum
export const colorList = {
  F1_415: "Violet",
  F2_445: "Dark Violet",
  F3_480: "Blue",
  F4_515: "Green",
  A5_VIS1: "A5_VIS1",
  A6_NIR1: "A6_NIR1",
  F5_555: "Dark Green",
  F6_590: "Deep Yellow",
  F7_630: "Light Red",
  F8_680: "Red",
  F9_VIS: "F9_VIS",
  F10_NIR: "F10_NIR"
};

function rgb2hue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  let segment;
  let shift;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let c = max - min;
  let hue;
  if (c === 0) {
    hue = 0;
  } else {
    switch (max) {
      case r:
        segment = (g - b) / c;
        shift = 0 / 60; // R° / (360° / hex sides)
        if (segment < 0) {
          // hue > 180, full rotation
          shift = 360 / 60; // R° / (360° / hex sides)
        }
        hue = segment + shift;
        break;
      case g:
        segment = (b - r) / c;
        shift = 120 / 60; // G° / (360° / hex sides)
        hue = segment + shift;
        break;
      case b:
        segment = (r - g) / c;
        shift = 240 / 60; // B° / (360° / hex sides)
        hue = segment + shift;
        break;
      default:
        segment = (r - g) / c;
        shift = 240 / 60; // B° / (360° / hex sides)
        hue = segment + shift;
    }
  }
  return hue * 60; // hue is in [0,6], scale it up
}

let normalizeStrength = (num) =>
  num > 99 && num < 1601 ? (num / 1600) * 100 : 50;

let wavelengthToRGB = function (wavelength) {
  let R = 0;
  let G = 0;
  let B = 0;

  // core translation into color
  if (wavelength >= 380 && wavelength <= 440) {
    R = (-1 * (wavelength - 440)) / (440 - 380);
    G = 0;
    B = 1;
  } else if (wavelength > 440 && wavelength <= 490) {
    R = 0;
    G = (wavelength - 440) / (490 - 440);
    B = 1;
  } else if (wavelength > 490 && wavelength <= 510) {
    R = 0;
    G = 1;
    B = (-1 * (wavelength - 510)) / (510 - 490);
  } else if (wavelength > 510 && wavelength <= 580) {
    R = (wavelength - 510) / (580 - 510);
    G = 1;
    B = 0;
  } else if (wavelength > 580 && wavelength <= 645) {
    R = 1;
    G = (-1 * (wavelength - 645)) / (645 - 580);
    B = 0;
  } else if (wavelength > 645 && wavelength <= 780) {
    R = 1;
    G = 0;
    B = 0;
  }

  // intensity adjustment near the vision limits
  let intensity = 1;
  if (wavelength >= 700) {
    intensity = 0.3 + (0.7 * (780 - wavelength)) / (780 - 700);
  } else if (wavelength < 420) {
    intensity = 0.3 + (0.7 * (wavelength - 380)) / (420 - 380);
  }
  console.log("intensity:", intensity);

  return [
    Math.round(R * intensity * 255),
    Math.round(G * intensity * 255),
    Math.round(B * intensity * 255)
  ];
};

// let updateCanvas = function (fillstyle) {
//   let canvas = document.getElementById("canvas");
//   let ctx = canvas.getContext("2d");
//   ctx.fillStyle = fillstyle;
//   ctx.fillRect(0, 0, 800, 100);
// };

export let wavelengthToHSL = (wavelength, strength) => {
  let rgb = wavelengthToRGB(485);
  return [
    rgb2hue(rgb[0], rgb[1], rgb[2]),
    `50%`,
    `${normalizeStrength(strength)}%`
  ];
};
