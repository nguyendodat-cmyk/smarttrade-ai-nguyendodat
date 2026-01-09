/**
 * SmartTrade AI - Entry Point
 * v1.4.7 - Using CommonJS require() for synchronous polyfill loading
 *
 * IMPORTANT: require() executes SYNCHRONOUSLY and IMMEDIATELY
 * Unlike ES imports which are hoisted and evaluated by Metro's dependency graph
 */

// ============================================================
// STEP 1: POLYFILLS (CommonJS require - runs synchronously!)
// ============================================================
// This MUST be require(), not import
// require() executes immediately, import is hoisted
require('./polyfills/url-polyfill');

// ============================================================
// STEP 2: START APP
// ============================================================
require('expo-router/entry');
