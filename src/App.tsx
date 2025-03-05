import Card from './components/Card'

function App() {
  const handleSendMessage = async () => {
    // Simulate an API call or email sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    window.location.href = 'mailto:contact@sukoya.design';
  }

  return (
    <Card onSendMessage={handleSendMessage} />
  )
}

export default App
