/**
 * SmartTrade AI - Error Boundary
 * Catches JavaScript errors and displays debug info
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Clipboard } from 'react-native'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 ErrorBoundary caught error:', error)
    console.error('🔴 Component stack:', errorInfo.componentStack)
    this.setState({ errorInfo })
  }

  handleCopy = () => {
    const { error, errorInfo } = this.state
    const errorText = `
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim()

    // @ts-ignore - Clipboard exists in RN
    if (typeof Clipboard !== 'undefined' && Clipboard.setString) {
      Clipboard.setString(errorText)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state

      return (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>⚠️ App Crashed</Text>
            <Text style={styles.subtitle}>SmartTrade AI v1.4.1 Debug</Text>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
            {/* Error Message */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Error Message:</Text>
              <Text style={styles.errorText}>{error?.message || 'Unknown error'}</Text>
            </View>

            {/* Error Stack */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stack Trace:</Text>
              <Text style={styles.stackText}>{error?.stack || 'No stack trace'}</Text>
            </View>

            {/* Component Stack */}
            {errorInfo?.componentStack && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Component Stack:</Text>
                <Text style={styles.stackText}>{errorInfo.componentStack}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} onPress={this.handleCopy}>
              <Text style={styles.buttonText}>📋 Copy Error</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.retryButton]} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>🔄 Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#252542',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd93d',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    fontFamily: 'monospace',
  },
  stackText: {
    fontSize: 12,
    color: '#ccc',
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  button: {
    flex: 1,
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#4a69bd',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})

export default ErrorBoundary
