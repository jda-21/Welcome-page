import Card from './components/Card'

function App() {
  const handleSendMessage = () => {
    // You can implement your message sending logic here
    console.log('Send message clicked')
    // For example: window.location.href = 'mailto:contact@sukoya.design'
  }

  return (
    <Card onSendMessage={handleSendMessage} />
  )
}

export default App
