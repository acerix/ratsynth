/*
 * Rational Sound Synthesizer - A musical instrument written in javascript.
 * Copyright (C) 2013 Dylan Ferris
 * 
 * This file is part of Rational Sound Synthesizer.
 * 
 * Rational Sound Synthesizer is free software: you may redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Rational Sound Synthesizer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Rational Sound Synthesizer.  If not, see <http://www.gnu.org/licenses/>.
 */

// The notes of the western scale, in matrix form

const Rational_Notes = [

	// I
	new Uint8Array([
		1, 0,
		0, 1
	]),
	
	// II minor
	new Uint8Array([
		24, 1,
		23, 1
	]),
	
	// II
	new Uint8Array([
		8, 1,
		7, 1
	]),
	
	// III minor
	new Uint8Array([
		5, 1,
		4, 1
	]),
	
	// III
	new Uint8Array([
		4, 1,
		3, 1
	]),
	
	// IV
	new Uint8Array([
		3, 1,
		2, 1
	]),
	
	// IV diminished
	new Uint8Array([
		38, 7,
		27, 5
	]),
	
	// V
	new Uint8Array([
		2, 1,
		1, 1
	]),
	
	// VI minor
	new Uint8Array([
		5, 3,
		3, 2
	]),
	
	// VI
	new Uint8Array([
		2, 3,
		1, 2
	]),
	
	// VII minor
	new Uint8Array([
		2, 7,
		1, 4
	]),
	
	// VII
	new Uint8Array([
		2, 13,
		1, 7
	])
	
];


// converts a note matrix to a rational number
function mat2_toRational(m) {
	return rat.fromValues( m[0] + m[1] , m[2] + m[3] );	
}




/* Scales */

function create_scale_from_intervals(intervals) {
	var notes = [];
	for (var i in intervals) {
		if (notes.length === 0)
			notes.push(intervals[i]);
		else
			notes.push(notes[notes.length - 1] + intervals[i]);
	}
	return new Uint8Array(notes);
}

function create_pentatonic_scale_from_septatonic_scale(s) {
	return new Uint8Array([ s[0], s[2], s[3], s[4] ]);
}


const Scale_Octave = create_scale_from_intervals([]);

const Scale_Chromatic = create_scale_from_intervals([
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
]);


const Scale_Ionian = create_scale_from_intervals([
	2, 2, 1, 2, 2, 2
]);

const Scale_Dorian = create_scale_from_intervals([
	2, 1, 2, 2, 2, 1
]);

const Scale_Phrygian = create_scale_from_intervals([
	1, 2, 2, 2, 1, 2
]);

const Scale_Lydian = create_scale_from_intervals([
	2, 2, 2, 1, 2, 2
]);

const Scale_Mixolydian = create_scale_from_intervals([
	2, 2, 1, 2, 2, 1
]);

const Scale_Aeolian = create_scale_from_intervals([
	2, 1, 2, 2, 1, 2
]);

const Scale_Locrian = create_scale_from_intervals([
	1, 2, 2, 1, 2, 2
]);


const Scale_Major = Scale_Ionian;

const Scale_Major_Pentatonic = create_pentatonic_scale_from_septatonic_scale(Scale_Major);


const Scale_Minor_Natural = Scale_Aeolian;

const Scale_Minor_Pentatonic = create_pentatonic_scale_from_septatonic_scale(Scale_Minor_Natural);

const Scale_Minor_Harmonic = create_scale_from_intervals([
	2, 1, 2, 2, 1, 3
]);

const Scale_Minor_Melodic_Ascending = create_scale_from_intervals([
	2, 1, 2, 2, 2, 2
]);

const Scale_Minor_Melodic_Descending = create_scale_from_intervals([
	2, 1, 2, 2, 1, 2
]);

const Scale_Blues = create_scale_from_intervals([
	3, 2, 1, 1, 3
]);

const Scale_Wicked = create_scale_from_intervals([
	1, 3, 1, 2, 1, 2
]);





/* Oscillators */

const WAVE_SINE = 1;
const WAVE_SQUARE = 2;
const WAVE_SAWTOOTH = 3;
const WAVE_SHARKTOOTH = 4;
const WAVE_STEPS = 5;
const WAVE_ZAP = 6;
const WAVE_NOISE = 255;

var AudioTrack_SineWave = function(sample_rate, frequency, max_amplitude) {
	this.sample_rate = typeof sample_rate === 'undefined' ? 22050 : sample_rate;
	this.max_amplitude = typeof max_amplitude === 'undefined' ? rat.ONE : max_amplitude;
	this.rotation = rat.clone(rat.ZERO);
	this.rotation_matrix = new Array(4);
	this.rotation_matrix = new Array(4);
	this.setFrequency(typeof frequency === 'undefined' ? rat.clone(rat.ZERO) : frequency);
	this.temp1 = rat.create();
	this.temp2 = rat.create();
	this.temp3 = rat.create();
	this.temp_sin = rat.create();
	this.temp_neg_sin = rat.create();
	this.temp_cos = rat.create();
	this.position = [
		rat.clone(this.max_amplitude),
		rat.clone(rat.ZERO)
	];
}

// for some reason, the result is out of tune... so this correction is applied to the frequency
var frequency_fudge_factor = rat.clone(rat.ONE);

AudioTrack_SineWave.prototype.setFrequency = function(frequency) {
	this.frequency = typeof frequency === 'object' ? frequency : rat.fromInteger(frequency);
	
	rat.scalar_divide(this.rotation, this.frequency, this.sample_rate);
	
	// why does the rotation need this correction?
	// any why is it different in Chromium vs Firefox?
	rat.mul(this.rotation, this.rotation, frequency_fudge_factor);
	
	this.temp_cos = rat.cos(rat.create(), this.rotation);
	this.temp_sin = rat.sin(rat.create(), this.rotation);
	
	this.rotation_matrix[0] = this.rotation_matrix[3] = this.temp_cos;
	this.rotation_matrix[2] = this.temp_sin;
	this.rotation_matrix[1] = rat.opposite(rat.create(), this.temp_sin);
	
};

AudioTrack_SineWave.prototype.audioFillBuffer = function(b) {
	for (var i=0, buffer_length=b.length; i < buffer_length; i++) {
		
		if (wave_type) {
			rat.copy(this.temp2, this.position[0]);
			rat.copy(this.temp3, this.position[1]);
			
			rat.mul(this.position[0], this.temp2, this.rotation_matrix[0]);
			rat.mul(this.temp1, this.temp3, this.rotation_matrix[1]);
			rat.add(this.position[0], this.position[0], this.temp1);
			
			rat.mul(this.position[1], this.temp2, this.rotation_matrix[2]);
			rat.mul(this.temp1, this.temp3, this.rotation_matrix[3]);
			rat.add(this.position[1], this.position[1], this.temp1);
			
			if (wave_type===WAVE_STEPS)
				rat.scalar_multiply(this.temp1, this.position[1], 4);
		}
		else {
			var last_position = rat.toDecimal(this.position[1]);
			if (active_audio_interface===2) last_position *= gainNode.gain.value;
		}
		if (this.position[1][1] !== 0) {
			
			switch(wave_type) {
				
				case 0:
					//b[i] = 0;
					b[i] = last_position; // fill the buffer with the value at the end of the last buffer
					break;
					
				case WAVE_SINE:
					b[i] = rat.toDecimal(this.position[1]);
					break;
					
				case WAVE_SQUARE:
					b[i] = rat.isNegative(this.position[1]) ? rat.floor(this.position[1]) : rat.ceil(this.position[1]);
					break;
					
				case WAVE_SAWTOOTH:
					rat.mul(this.temp1, this.position[0], this.position[1]);
					b[i] = rat.isNegative(this.temp1) ? rat.floor(this.temp1) : rat.ceil(this.temp1);
					break;
				
				case WAVE_SHARKTOOTH:
					rat.mul(this.temp1, this.position[0], this.position[1]);
					b[i] = rat.toDecimal(this.temp1);
					break;
				
				case WAVE_SQUARE:
					b[i] = rat.isNegative(this.position[1]) ? rat.floor(this.position[1]) : rat.ceil(this.position[1]);
					break;
					
				case WAVE_STEPS:
					b[i] = rat.round(this.temp1) / 4;
					break;
				
				case WAVE_ZAP:
					b[i] = Math.random() * rat.toDecimal(this.position[1]);
					break;
				
				case WAVE_NOISE:
					b[i] = Math.random() - .5;
					break;
				
			}
			
			// emulate webkit gain (mozilla)
			if (active_audio_interface===2 && wave_type)
				b[i] *= gainNode.gain.value;
							
		}
	}
};
