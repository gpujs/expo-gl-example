import React, { Component, Fragment } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { GLView } from 'expo-gl';
import { GPU, IKernelRunShortcut } from '@gpujs/expo-gl';

async function createVanillaKernel() {
  const context = await GLView.createContextAsync();
  const gpu = new GPU({ context });
  return gpu.createKernel(function () {
    return Math.random();
  }, {
    output: [2048, 2048],
  });
}

interface IAppState {
  error: any,
  kernel: IKernelRunShortcut,
  milliseconds: number,
  kernelResult: number[][],
  kernelRunning: boolean,
}

export default class App extends Component<any, IAppState> {
  setError = error => {
    this.setState({ error });
  };

  setKernel = async kernel => {
    this.setState({ kernel });
  };

  runKernel = () => {
    this.setState({
      kernelRunning: true,
    });
    const start = Date.now();
    const result = this.state.kernel();
    const milliseconds = Date.now() - start;
    this.setState({
      kernelResult: result as number[][],
      milliseconds,
      kernelRunning: false,
    });
  };

  constructor(props) {
    super(props);
    this.state = {
      error: null,
      kernel: null,
      kernelResult: null,
      milliseconds: null,
      kernelRunning: false,
    };
  }

  componentDidMount(): void {
    createVanillaKernel()
      .catch(this.setError)
      .then(this.setKernel);
  }

  render() {
    const {
      error,
      kernel,
      kernelResult,
      milliseconds,
      kernelRunning,
    } = this.state;

    let children;

    if (error) {
      children = <Text>There was an error { error.toString() }</Text>;
    } else if (!kernel) {
      children = <Text>Loading context</Text>;
    } else {
      children = <Fragment>
        <Button
          disabled={kernelRunning}
          onPress={this.runKernel}
          title="Tap to run Kernel"
        />
        {
          kernelResult
            ? <Text>Kernel calculated with length of { kernelResult.length * kernelResult[0].length } and took { milliseconds } milliseconds</Text>
            : null
        }
      </Fragment>
    }
    return (<View style={styles.container}>{children}</View>);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
