require 'net/http'
require 'json'
require 'time'
require 'write_xlsx'

# ================================
# Fetch tweet history (logged-in user)
# ================================
url = URI('http://localhost:8080/api/tweets/history/me?limit=1000')
response = Net::HTTP.get(url)
tweets = JSON.parse(response)

# ================================
# Create workbook & worksheet
# ================================
workbook  = WriteXLSX.new('tweet_history.xlsx')
worksheet = workbook.add_worksheet('Tweet History')

# ================================
# Formats
# ================================
header_format = workbook.add_format(
  bold: true,
  border: 1,
  align: 'center'
)

text_format = workbook.add_format(
  border: 1
)

date_format = workbook.add_format(
  border: 1,
  num_format: 'yyyy-mm-dd hh:mm:ss'
)

# Conditional formats
success_format = workbook.add_format(
  bg_color: '#C6EFCE',
  font_color: '#006100'
)

failed_format = workbook.add_format(
  bg_color: '#FFC7CE',
  font_color: '#9C0006'
)

auth_expired_format = workbook.add_format(
  bg_color: '#F4CCCC',
  font_color: '#660000'
)

rate_limited_format = workbook.add_format(
  bg_color: '#FFE599',
  font_color: '#7F6000'
)

# ================================
# Header row
# ================================
headers = [
  'Platform',
  'Username',
  'Original Text',
  'Posted Text',
  'Tweet ID',
  'Status',
  'Error',
  'Attempts',
  'Created At'
]

headers.each_with_index do |h, col|
  worksheet.write(0, col, h, header_format)
end

# ================================
# Data rows
# ================================
tweets.each_with_index do |t, row|
  r = row + 1

  created_at =
    t['createdAt'] ? Time.at(t['createdAt'].to_i / 1000) : nil

  worksheet.write(r, 0, t['platform'], text_format)
  worksheet.write(r, 1, t['username'], text_format)
  worksheet.write(r, 2, t['text'], text_format)
  worksheet.write(r, 3, t['sentText'], text_format)

  # Tweet ID as STRING (prevents scientific notation)
  worksheet.write_string(r, 4, t['tweetId'].to_s, text_format)

  worksheet.write(r, 5, t['status'], text_format)
  worksheet.write(r, 6, t['errorMessage'], text_format)
  worksheet.write(r, 7, t['attemptCount'], text_format)

  if created_at
    worksheet.write_date_time(
      r,
      8,
      created_at.strftime('%Y-%m-%dT%H:%M:%S'),
      date_format
    )
  end
end

# ================================
# Conditional formatting (entire row)
# ================================
last_row = tweets.size + 1
row_range = "A2:I#{last_row}"

worksheet.conditional_formatting(row_range, {
  type:     'formula',
  criteria: '=$F2="SUCCESS"',
  format:   success_format
})

worksheet.conditional_formatting(row_range, {
  type:     'formula',
  criteria: '=$F2="FAILED"',
  format:   failed_format
})

worksheet.conditional_formatting(row_range, {
  type:     'formula',
  criteria: '=$F2="AUTH_EXPIRED"',
  format:   auth_expired_format
})

worksheet.conditional_formatting(row_range, {
  type:     'formula',
  criteria: '=$F2="RATE_LIMITED"',
  format:   rate_limited_format
})

# ================================
# Sheet usability tweaks
# ================================
worksheet.freeze_panes(1, 0)

worksheet.set_column(0, 0, 8)    # Platform
worksheet.set_column(1, 1, 14)   # Username
worksheet.set_column(2, 3, 40)   # Text
worksheet.set_column(4, 4, 24)   # Tweet ID
worksheet.set_column(5, 6, 16)   # Status / Error
worksheet.set_column(7, 7, 10)   # Attempts
worksheet.set_column(8, 8, 22)   # Created At

# ================================
# Finish
# ================================
workbook.close

puts "tweet_history.xlsx exported successfully"