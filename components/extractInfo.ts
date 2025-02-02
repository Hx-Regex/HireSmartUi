export function extractInfo(text: string) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const phoneRegex = /\b(\+\d{1,2}\s?)?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/g
    const linkRegex = /(https?:\/\/[^\s]+)/g
  
    return {
      emails: Array.from(new Set(text.match(emailRegex) || [])),
      phoneNumbers: Array.from(new Set(text.match(phoneRegex) || [])),
      links: Array.from(new Set(text.match(linkRegex) || [])),
    }
  }
  
  