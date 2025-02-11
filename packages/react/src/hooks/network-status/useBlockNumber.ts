import * as React from 'react'

import { useProvider, useWebSocketProvider } from '../providers'

type Config = {
  /** Disables fetching */
  skip?: boolean
  /** Subscribe to changes */
  watch?: boolean
}

type State = {
  blockNumber?: number
  error?: Error
  loading?: boolean
}

const initialState: State = {
  loading: false,
}

export const useBlockNumber = ({ skip, watch }: Config = {}) => {
  const provider = useProvider()
  const webSocketProvider = useWebSocketProvider()
  const [state, setState] = React.useState<State>(initialState)

  const getBlockNumber = React.useCallback(async () => {
    try {
      setState((x) => ({ ...x, error: undefined, loading: true }))
      const blockNumber = await provider.getBlockNumber()
      setState((x) => ({ ...x, blockNumber, loading: false }))
      return { data: blockNumber, error: undefined }
    } catch (error_) {
      const error = <Error>error_
      setState((x) => ({ ...x, error, loading: false }))
      return { data: undefined, error }
    }
  }, [provider])

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    if (skip) return

    let didCancel = false
    if (didCancel) return
    getBlockNumber()

    return () => {
      didCancel = true
    }
  }, [skip])
  /* eslint-enable react-hooks/exhaustive-deps */

  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    if (!watch) return

    const listener = (blockNumber: State['blockNumber']) =>
      setState((x) => ({ ...x, blockNumber }))

    const provider_ = webSocketProvider ?? provider
    provider_.on('block', listener)

    return () => {
      provider_.off('block', listener)
    }
  }, [])
  /* eslint-enable react-hooks/exhaustive-deps */

  return [
    {
      data: state.blockNumber,
      error: state.error,
      loading: state.loading,
    },
    getBlockNumber,
  ] as const
}
