import Modal from './Modal'

interface QRViewerProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  eventTitle: string
  qrData?: string
}

function QRViewer({ isOpen, onClose, ticketId, eventTitle, qrData }: QRViewerProps) {
  const qrUrl = qrData || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`TICKET:${ticketId}`)}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Ticket" size="sm">
      <div className="text-center">
        <h4 className="font-medium text-gray-900 mb-4">{eventTitle}</h4>
        <div className="bg-white p-4 rounded-lg inline-block border border-gray-200 mb-4">
          <img
            src={qrUrl}
            alt="Ticket QR Code"
            className="w-48 h-48 mx-auto"
          />
        </div>
        <p className="text-sm text-gray-600 mb-2">Ticket ID</p>
        <p className="font-mono text-sm bg-gray-100 px-4 py-2 rounded-lg inline-block">
          {ticketId}
        </p>
        <p className="text-xs text-gray-500 mt-4">
          Show this QR code at the event for check-in
        </p>
      </div>
    </Modal>
  )
}

export default QRViewer
