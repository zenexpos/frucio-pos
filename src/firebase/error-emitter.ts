'use client';
import { EventEmitter } from 'events';

// This is a client-side only event emitter.
const errorEmitter = new EventEmitter();

// We need to increase the max listeners to avoid warnings, as many components
// might listen for errors.
errorEmitter.setMaxListeners(20);

export { errorEmitter };
